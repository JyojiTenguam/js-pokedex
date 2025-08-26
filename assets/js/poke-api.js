const pokeApi = {};

async function convertPokeApiDetailToPokemon(pokeDetail) {
  const pokemon = new Pokemon();
  pokemon.number = pokeDetail.id;
  pokemon.name = pokeDetail.name;
  pokemon.types = pokeDetail.types.map((t) => t.type.name);
  pokemon.type = pokemon.types[0];
  pokemon.photo = pokeDetail.sprites.other.dream_world.front_default;
  pokemon.height = pokeDetail.height / 10 + " m";
  pokemon.weight = pokeDetail.weight / 10 + " kg";
  pokemon.abilities = pokeDetail.abilities
    .map((a) => a.ability.name)
    .join(", ");
  pokemon.stats = pokeDetail.stats.map((s) => ({
    name: s.stat.name,
    value: s.base_stat,
  }));

  const speciesRes = await fetch(pokeDetail.species.url);
  const speciesData = await speciesRes.json();
  pokemon.category = speciesData.genera.find(
    (g) => g.language.name === "en"
  ).genus;
  pokemon.genderRate = speciesData.gender_rate;
  pokemon.evolutions = await getEvolutions(speciesData.evolution_chain.url);

  pokemon.weaknesses = await getWeaknesses(pokemon.types);

  pokemon.speciesUrl = pokeDetail.species.url;

  pokemon.stats = pokeDetail.stats.map((s) => ({
    name: s.stat.name,
    value: s.base_stat,
  }));

  return pokemon;
}

pokeApi.getPokemonDetail = (pokemon) => {
  return fetch(pokemon.url)
    .then((response) => response.json())
    .then(convertPokeApiDetailToPokemon);
};

pokeApi.getPokemons = (offset = 0, limit = 5) => {
  const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;

  return fetch(url)
    .then((response) => response.json())
    .then((jsonBody) => jsonBody.results)
    .then((pokemons) => pokemons.map(pokeApi.getPokemonDetail))
    .then((detailRequests) => Promise.all(detailRequests))
    .then((pokemonsDetails) => pokemonsDetails);
};

async function getEvolutions(evoChainUrl) {
  const res = await fetch(evoChainUrl);
  const evoData = await res.json();
  const evolutions = [];

  function traverse(chain) {
    evolutions.push(chain.species.name);
    chain.evolves_to.forEach((e) => traverse(e));
  }

  traverse(evoData.chain);

  const evoDetails = await Promise.all(
    evolutions.map(async (name) => {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const data = await res.json();
      return {
        name: data.name,
        types: data.types.map((t) => t.type.name),
        photo: data.sprites.other.dream_world.front_default,
      };
    })
  );

  return evoDetails;
}

async function getWeaknesses(types) {
  const weaknessesSet = new Set();
  for (let type of types) {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    const data = await res.json();
    data.damage_relations.double_damage_from.forEach((t) =>
      weaknessesSet.add(t.name)
    );
  }
  return Array.from(weaknessesSet);
}
