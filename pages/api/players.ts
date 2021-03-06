import type { NextApiRequest, NextApiResponse } from "next";
import {
  MatchInfo,
  PlayerInfo,
  TeammateCount,
  TeammateInfo,
} from "../../lib/player";

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

async function fetchPlayerInfo(nameOrId: string): Promise<PlayerInfo> {
  const res = await fetch(encodeURI(`https://uniteapi.dev/p/${nameOrId}`));
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

  const name = assertExists(
    $doc.querySelector(".player-card-name-info > p")?.text
  );

  const [id, lvStr, cup] = $doc
    .querySelectorAll(".player-card-text > p")
    .map((c) => c.text.trim());
  const level = Number(lvStr.match(/\d+/)?.[0] ?? 0);

  const masterRank = Number(
    $doc.querySelector(".master-rank")?.text?.trim() ?? "0"
  );

  const recentTeammates: TeammateCount[] = $doc
    .querySelectorAll(".potential-partners-span")
    .map(($span) => {
      const [name, countStr] = $span
        .querySelectorAll("div")
        .map(($div) => $div.text);
      const count = Number(assertExists(countStr.match(/\d+/)?.[0]));
      return { name, count };
    }).sort((a, b) => b.count - a.count);

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

      const parseTeam = (color: "purple" | "orange"): TeammateInfo[] => {
        return $detail
          .querySelectorAll(`tr.mh-row-color-${color}`)
          .map(($tr) => {
            const pokemon = assertExists(
              $tr
                .querySelector(".heroicon-image")
                ?.attributes?.src?.match(/(?<=t_Square_).*(?=\.png)/)?.[0]
            );
            const [level, name, score, kdi, stat] = $tr
              .querySelectorAll("td")
              .map(($td) => $td.innerText.trim().replace(/\s{2,}/g, "|"));
            const [kill, assist, interrupt] = kdi
              .split("|")
              .map((x) => Number(x));
            const [damageDealt, damageTaken, recovery] = assertExists(
              stat.match(/(?<=\|)\d+/g)
            ).map((x) => Number(x));
            return {
              level: Number(level),
              name,
              score: Number(score),
              pokemon,
              kill,
              assist,
              interrupt,
              damageDealt,
              damageTaken,
              recovery,
            };
          });
      };

      const orangeTeam = parseTeam("purple");
      const purpleTeam = parseTeam("orange");
      const teamAlly = isAllyOrange ? orangeTeam : purpleTeam;
      const teamOpponent = isAllyOrange ? purpleTeam : orangeTeam;

      recentRankedMatches.push({
        time,
        result: assertExists(result),
        allyScore,
        opponentScore,
        teamAlly,
        teamOpponent,
      });
    }
  }

  return {
    id,
    name,
    level,
    cup,
    masterRank,
    recentTeammates,
    recentRankedMatches,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerInfo>
) {
  // TODO: Better typing and validation.
  const { name } = req.query;
  if (typeof name !== "string") {
    res.status(200).json({
      id: "",
      name: "",
      level: 0,
      cup: "",
      masterRank: 0,
      recentTeammates: [],
      recentRankedMatches: [],
    });
    return;
  }
  const info = await fetchPlayerInfo(name);
  res.status(200).json(info);
}
