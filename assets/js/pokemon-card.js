const pokemonCard = document.getElementById("pokemonCard");
const params = new URLSearchParams(window.location.search);
const number = params.get("number");

// Função para calcular fraquezas do Pokémon
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

// Função para buscar evoluções
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

// Renderiza o card
if (number) {
  (async () => {
    const pokemon = await pokeApi.getPokemonDetail({
      url: `https://pokeapi.co/api/v2/pokemon/${number}/`,
    });

    // Dados da espécie
    const speciesRes = await fetch(pokemon.speciesUrl);
    const speciesData = await speciesRes.json();

    const categoryFull = speciesData.genera.find(
      (g) => g.language.name === "en"
    ).genus;
    const category = categoryFull.replace(" Pokémon", "");

    let genderHTML = '';
    if (speciesData.gender_rate === -1) {
      genderHTML = '<span class="gender unknown">Desconhecido</span>';
    } else {
      genderHTML = `
        <span class="gender male">♂</span> / 
        <span class="gender female">♀</span>
      `;
    }

    // Fraquezas e evoluções
    const weaknesses = await getWeaknesses(pokemon.types);
    const evolutions = await getEvolutions(speciesData.evolution_chain.url);

    // Monta HTML do card
    pokemonCard.innerHTML = `
      <h1>${pokemon.name} #${pokemon.number}</h1>
      <img src="${pokemon.photo}" alt="${pokemon.name}">
      <div class="info">
        <p>Tipos: ${pokemon.types
          .map((type) => `<span class="type ${type}">${type}</span>`)
          .join("")}</p>
        <p>Categoria: ${category}</p>
        <p>Altura: ${pokemon.height}</p>
        <p>Peso: ${pokemon.weight}</p>
        <p>Habilidades: ${pokemon.abilities}</p>
        <p>Sexo: ${genderHTML}</p>
      </div>
      <h3>Estatísticas:</h3>
      <ul class="stats-list">
        ${pokemon.stats
          .map(
            (stat) => `
        <li>
          <span class="stat-name">${stat.name.toUpperCase()}</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width:${stat.value}%"></div>
          </div>
          <span class="stat-value">${stat.value}</span>
        </li>
    `
          )
          .join("")}
      </ul>


      <h3>Fraquezas:</h3>
        <div class="weaknesses">
          ${weaknesses.map((w) => `<span class="type ${w}">${w}</span>`).join(" ")}
        </div>

      <h3>Evoluções:</h3>
      <div class="evolution-container">
        ${evolutions
          .map(
            (evo) => `
          <div class="evolution-card ${evo.types[0]}">
            <img src="${evo.photo}" alt="${evo.name}">
            <p>${evo.name}</p>
            <p>${evo.types.map((type) => `<span class="type ${type}">${type}</span>`)
          .join("")}</p></p>
    
          </div>
        `
          )
          .join("")}
      </div>

      <a href="index.html">← Voltar</a>
    `;
  })();
}
