import type { NextPage } from "next";
import Head from "next/head";
import { fetchStats, Stat } from "../lib/stat";
import { useCallback, useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { Line } from "@nivo/line";
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  Box,
  Container,
  Text,
} from "@chakra-ui/react";

const EffectiveHpChart: React.FC<{ stat: Stat }> = ({ stat }) => {
  const [level, setLevel] = useState<number>(15);
  const handleLevelChange = useCallback((newLevel: number) => {
    // TODO: debounce the update for the actual bar chart for better
    // performance.
    setLevel(newLevel);
  }, []);

  if (stat === null) {
    return null;
  }

  type EffectiveHpStat = { name: string; phyHp: number; spHp: number };

  // TODO: Make this configurable.
  const getSortKey = (p: EffectiveHpStat) => p.phyHp + p.spHp;

  const data = stat
    .map((pokemon) => {
      const name = pokemon.name;
      const levelStat = pokemon.level.find((l) => l.level === level);
      if (levelStat === undefined) {
        throw new Error(`Failed to find stat at level ${level} for ${name}`);
      }
      const { hp, defense, sp_defense } = levelStat;
      const phyHp = Math.floor((hp * (600 + defense)) / 600);
      const spHp = Math.floor((hp * (600 + sp_defense)) / 600);
      return { name, phyHp, spHp };
    })
    .sort((p1, p2) => {
      return getSortKey(p1) - getSortKey(p2);
    });

  return (
    <VStack w="100%">
      <Box w="100%" px={4}>
        <Text>Level {level}</Text>
        <Slider min={1} max={15} defaultValue={15} onChange={handleLevelChange}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </Box>
      <Box w="100%" h="1000px">
        <ResponsiveBar
          layout="horizontal"
          groupMode="grouped"
          margin={{ top: 0, right: 40, bottom: 50, left: 80 }}
          padding={0.3}
          enableGridY={false}
          data={data}
          indexBy="name"
          keys={["phyHp", "spHp"]}
          axisLeft={{
            legendOffset: -40,
            legendPosition: "middle",
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
        />
      </Box>
    </VStack>
  );
};

const LevelStatChart: React.FC<{ stat: Stat }> = ({ stat }) => {
  // TODO: Select pokemons to compare.
  // TODO: Select stat to compare.
  const data = stat
    .map((s) => ({
      id: s.name,
      data: s.level.map((lv) => ({ x: lv.level, y: lv.attack })),
    }))
    .sort((a, b) => a.data[a.data.length - 1].y - b.data[b.data.length - 1].y);
  return (
    <Box w="100%" h="640px">
      <Line
        width={600}
        height={640}
        enableSlices="x"
        margin={{ top: 20, right: 120, bottom: 50, left: 80 }}
        data={data}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            itemWidth: 80,
            itemHeight: 20,
            translateX: 100,
            symbolSize: 12,
          },
        ]}
      />
    </Box>
  );
};

const Home: NextPage = () => {
  const [stat, setStat] = useState<Stat | null>(null);
  useEffect(() => {
    fetchStats().then((newStat) => {
      setStat(newStat);
    });
  }, []);

  return (
    <Container maxW="2xl" centerContent pt={4}>
      <Head>
        <title>Unite Explorer</title>
        <meta
          name="description"
          content="Data Visualization for Pokemon Unite"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {stat && <EffectiveHpChart stat={stat} />}
      {stat && <LevelStatChart stat={stat} />}
    </Container>
  );
};

export default Home;
