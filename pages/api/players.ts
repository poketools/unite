import type { NextApiRequest, NextApiResponse } from "next";

import { parse } from "node-html-parser";
import dayjs from "dayjs";

import { writeFileSync } from "fs";

function assert<T>(
  condition: T,
  message: string = "assertion error"
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists<T>(value: T | null | undefined): T {
  assert(value !== null);
  assert(value !== undefined);
  return value;
}

interface TeamMateInfo {
  name: string;
  pokemon: string;
  score: number;
  kill: number;
  assist: number;
  interrupt: number;
  damageDealt: number;
  damageTaken: number;
  recovery: number;
}

interface MatchInfo {
  // ISO8601 string with timezone from dayjs.
  time: string;

  result: string;
  allyScore: number;
  opponentScore: number;
  teamAlly: TeamMateInfo[];
  teamOpponent: TeamMateInfo[];
}

interface PlayerInfo {
  masterRank: number;
  recentRankedMatches: MatchInfo[];
}

async function fetchPlayerInfo(name: string): Promise<PlayerInfo> {
  const res = await fetch(encodeURI(`https://uniteapi.dev/p/${name}`));
  const html = await res.text();

  // Fix the malformatted html in the result that will fail the parser.
  const fixedHtml = html
    .replace("</div\n", "</div>\n")
    .replace(
      /<div>\n\s*<div class='heroicon-parent'>/gm,
      `<div class='heroicon-parent'>`
    )
    .replace(
      /<a href="#"><img class='heroicon-item'/g,
      `<img class='heroicon-item'`
    )
    .replace("</section>", "</div></section>")
    .replace("</div>\n<script", "<script")
    .replace("</body>\n</html>\n</body>", "</body>\n</html>");

  // TODO: Remove this debugging file.
  writeFileSync("/tmp/a.html", fixedHtml);

  // TODO: This is soooooo slow. Maybe we should do it in simple regex for
  // better performance.
  const $doc = parse(fixedHtml);

  const masterRank = Number(
    $doc.querySelector(".master-rank")?.text?.trim() ?? "0"
  );

  const recentRankedMatches: MatchInfo[] = [];

  const $ranked = $doc.querySelector("#ranked .mh-list-container");
  if ($ranked !== null) {
    const $summaries = $ranked.querySelectorAll(".mh-tab.collapsible");
    const $details = $ranked.querySelectorAll(".content");
    assert($summaries.length === $details.length);
    for (let i = 0; i < $summaries.length; i++) {
      const $summary = $summaries[i];
      const $detail = $details[i];
      const result = $summary.querySelector("div > b")?.innerText;
      const time = dayjs
        .unix(
          Number(
            assertExists($summary.querySelector("unix-timestamp")?.innerText)
          )
        )
        .format();

      // Yes, `.mh-purple` is for orange score. It seems that UniteAPI dev
      // messed the mh-push class.
      const orangeScore = Number(
        assertExists($summary.querySelector(".mh-purple")?.innerText)
      );
      const purpleScore = Number(
        assertExists($summary.querySelector(".mh-orange")?.innerText)
      );

      const isAllyOrange = $detail.querySelector(".mh-current-orange") !== null;
      const allyScore = isAllyOrange ? orangeScore : purpleScore;
      const opponentScore = isAllyOrange ? purpleScore : orangeScore;

      recentRankedMatches.push({
        time,
        result: assertExists(result),
        allyScore,
        opponentScore,
        teamAlly: [],
        teamOpponent: [],
      });
    }
  }

  return { masterRank, recentRankedMatches };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerInfo>
) {
  // TODO: Better typing and validation.
  const { name } = req.query;
  if (typeof name !== "string") {
    res.status(200).json({ masterRank: 0, recentRankedMatches: [] });
    return;
  }
  const info = await fetchPlayerInfo(name);
  res.status(200).json(info);
}
