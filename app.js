const bagInput = document.getElementById('bagFile');
const awardInput = document.getElementById('awardFile');
const identifierInput = document.getElementById('identifier');
const includeUnavailableInput = document.getElementById('includeUnavailable');
const resultDiv = document.getElementById('result');
const calculateBtn = document.getElementById('calculateBtn');

// Expresión regular por defecto
const parserRegex = /^(?<order>\d+)\s+(?<name>.+?)\s+(?<id>\w+)\s+(?<specialty>\w+)\s+(?<community>\w+)\s+(?<status>DISPONIBLE|NO DISPONIBLE)$/;

async function readPdf(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

function parseBag(text) {
  const lines = text.split('\n');
  return lines.map(line => {
    const match = parserRegex.exec(line);
    if (match && match.groups) {
      return {
        order: parseInt(match.groups.order),
        name: match.groups.name,
        id: match.groups.id,
        specialty: match.groups.specialty,
        community: match.groups.community,
        status: match.groups.status,
      };
    }
    return null;
  }).filter(Boolean);
}

calculateBtn.addEventListener('click', async () => {
  const bagFile = bagInput.files[0];
  if (!bagFile) {
    resultDiv.innerText = 'Debes seleccionar el PDF de la bolsa.';
    return;
  }

  const bagText = await readPdf(bagFile);
  let bag = parseBag(bagText);

  if (!includeUnavailableInput.checked) {
    bag = bag.filter(row => row.status === 'DISPONIBLE');
  }

  const id = identifierInput.value.trim();
  const idx = bag.findIndex(row => row.id.includes(id));

  if (idx >= 0) {
    resultDiv.innerHTML = `Estás en la posición <strong>${idx + 1}</strong> de ${bag.length}.`;
  } else {
    resultDiv.innerText = 'No se encontró tu identificador en la lista.';
  }
});
