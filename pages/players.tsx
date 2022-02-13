import type { NextPage } from "next";
import { useRouter } from "next/router";

import { Container, Input, Text, IconButton, HStack } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { PlayerInfo } from "../lib/player";
import { useForm, SubmitHandler } from "react-hook-form";

import useSWR from "swr";
import { useEffect, useState } from "react";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [inputValue, setInputValue] = useState("");
  const { info, isLoading, isError } = usePlayerInfo(name);
  const { register, handleSubmit } = useForm<FormInput>();
  useEffect(() => {
    const newName = router.query?.name ?? "";
    if (typeof newName === "string" && newName !== "") {
      setName(newName);
      setInputValue(newName);
    }
  }, [router.query]);
  const onSubmit: SubmitHandler<FormInput> = (data) => {
    setName(data.name);
    router.push(encodeURI(`/players?name=${data.name}`), undefined, {
      shallow: true,
    });
  };
  const handleInputValueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInputValue(event.target.value);
  };
  return (
    <Container maxW="2xl" centerContent pt={4}>
      <Head>
        <title>Unite Player</title>
        <meta name="description" content="Get Pokemon Unite Player Info" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <form onSubmit={handleSubmit(onSubmit)}>
        <HStack>
          <Input
            placeholder="Name or ID"
            {...register("name")}
            value={inputValue}
            onChange={handleInputValueChange}
          />
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
