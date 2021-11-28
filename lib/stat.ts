import { z } from "zod";

const maybeStringNumber = z
  .union([z.string(), z.number()])
  .transform((x) => Number(x));

const statSchema = z.array(
  z.object({
    name: z.string(),
    level: z.array(
      z.object({
        level: maybeStringNumber,
        hp: maybeStringNumber,
        attack: maybeStringNumber,
        defense: maybeStringNumber,
        sp_attack: maybeStringNumber,
        sp_defense: maybeStringNumber,
        crit: maybeStringNumber,
        cdr: maybeStringNumber,
        lifesteal: maybeStringNumber,
      })
    ),
  })
);

// TODO: Maybe an additional transform from snake_case key to camelCase for
// consistency.

export type Stat = z.infer<typeof statSchema>;

export async function fetchStats(): Promise<Stat> {
  const res = await fetch("https://unite-db.com/stats.json");
  const data = await res.json();
  return statSchema.parse(data);
}
