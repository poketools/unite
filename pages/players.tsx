import type { NextPage } from "next";
import {
  Container,
  Input,
  Text,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { PlayerInfo } from "../lib/player";
import { useForm, SubmitHandler } from "react-hook-form";

import useSWR from "swr";
import { useState } from "react";
import Head from "next/head";

async function fetcher<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const res = await fetch(...args);
  const data: T = await res.json();
  return data;
}

const usePlayerInfo = (name: string) => {
  // TODO: better typing?
  const { data, error } = useSWR<PlayerInfo>(
    name !== "" ? encodeURI(`/api/players?name=${name}`) : null,
    fetcher
  );
  return {
    info: data,
    isLoading: name !== "" && data === undefined && !error,
    isError: !!error,
  };
};

type FormInput = { name: string };

const PlayerInfoSummary: React.FC<{ info: PlayerInfo }> = ({ info }) => {
  const summary: Partial<PlayerInfo> = { ...info };
  delete summary.recentRankedMatches;
  return <pre>{JSON.stringify(summary, null, 2)}</pre>;
};

const Players: NextPage = () => {
  const [name, setName] = useState("");
  const { info, isLoading, isError } = usePlayerInfo(name);
  const { register, handleSubmit } = useForm<FormInput>();
  const onSubmit: SubmitHandler<FormInput> = (data) => {
    setName(data.name);
  };
  return (
    <Container maxW="2xl" centerContent pt={4}>
      <Head>
        <title>Unite Player</title>
        <meta
          name="description"
          content="Get Pokemon Unite Player Info"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <form onSubmit={handleSubmit(onSubmit)}>
        <HStack>
          <Input placeholder="Name or ID" {...register("name")} />
          <IconButton
            type="submit"
            colorScheme="blue"
            aria-label="Search database"
            icon={<SearchIcon />}
          />
        </HStack>
      </form>
      {isLoading && <Text>Loading...</Text>}
      {isError && <Text>Error :(</Text>}
      {info !== undefined && <PlayerInfoSummary info={info} />}
    </Container>
  );
};

export default Players;
