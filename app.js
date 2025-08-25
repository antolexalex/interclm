const BAG_URL = "https://www.educa.jccm.es/es/bolsatra/bolsa-trabajo-secundaria-regimen-especial/bolsas-ordinarias-reserva-provisionales-curso-2025-2026-cue.ficheros/1075911-20250801%20Bolsa%20ordinaria%20provisional%20cuerpo%200590.pdf";
const AWARD_URL = "https://www.educa.jccm.es/es/bolsatra/bolsa-trabajo-secundaria-regimen-especial/adjudicacion-definitiva-centralizada-plazas-previa-inicio-4.ficheros/1077121-20250812%20Adjudicados%200590%20%E2%80%93%20Oposici%C3%B3n.pdf"; // Cambiar por URL real

const identifierInput = document.getElementById('identifier');
const includeUnavailableInput = document.getElementById('includeUnavailable');
const includeAwardInput = document.getElementById('includeAward');
const resultDiv = document.getElementById('result');
const calculateBtn = document.getElementById('calculateBtn');

// Regex por defecto para parsear PDFs
const parserRegex = /^(?<order>\d+)\s+(?<name>.+?)\s+(?<id>\w+)\s+(?<specialty>\w+)\s+(?<community>\w+)\s+(?<status>DISPONIBLE|NO DISPONIBLE)$/;

async function readPdfFromUrl(url) {
  const data = await fetch(url).then(res => res.arrayBuffer());
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
  return text.split('\n').map(line => {
    const match = parserRegex.exec(line);
    if (match && match.groups) {
      return {
        order: parseInt(match.groups.order),
        name: match.groups.name,
        id: match.groups.id,
        specialty: match.groups.specialty,
        community: match.groups.community,
        status: match.groups.status
      };
    }
    return null;
  }).filter(Boolean);
}

calculateBtn.addEventListener('click', async () => {
  resultDiv.innerText = "Calculando...";
  const id = identifierInput.value.trim();
  if (!id) {
    resultDiv.innerText = "Introduce tu identificador.";
    return;
  }

  try {
    let bagText = await readPdfFromUrl(BAG_URL);
    let bag = parseBag(bagText);

    if (includeAwardInput.checked) {
      let awardText = await readPdfFromUrl(AWARD_URL);
      let award = parseBag(awardText);
      bag = bag.concat(award);
    }

    if (!includeUnavailableInput.checked) {
      bag = bag.filter(row => row.status === 'DISPONIBLE');
    }

    const idx = bag.findIndex(row => row.id.includes(id));

    if (idx >= 0) {
      resultDiv.innerHTML = `Estás en la posición <strong>${idx + 1}</strong> de ${bag.length}.`;
    } else {
      resultDiv.innerText = "No se encontró tu identificador en la lista.";
    }

  } catch (err) {
    resultDiv.innerText = "Error leyendo los PDFs. Revisa la URL o tu conexión.";
    console.error(err);
  }
});
