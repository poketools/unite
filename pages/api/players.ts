import type { NextApiRequest, NextApiResponse } from "next";

import { parse } from "node-html-parser";

interface PlayerInfo {
  masterRank: number;
}

async function fetchPlayerInfo(name: string): Promise<PlayerInfo> {
  const res = await fetch(encodeURI(`https://uniteapi.dev/p/${name}`));
  const html = await res.text();

  // TODO: This is soooooo slow. Maybe we should do it in simple regex for better performance.
  const doc = parse(html);

  const masterRank = Number(
    doc.querySelector(".master-rank")?.text?.trim() ?? "0"
  );
  return { masterRank };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerInfo>
) {
  // TODO: Better typing and validation.
  const { name } = req.query;
  if (typeof name !== "string") {
    res.status(200).json({ masterRank: 0 });
    return;
  }
  const info = await fetchPlayerInfo(name);
  res.status(200).json(info);
}
