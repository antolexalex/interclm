const BAG_URL = "https://www.educa.jccm.es/es/bolsatra/bolsa-trabajo-secundaria-regimen-especial/bolsas-ordinarias-reserva-provisionales-curso-2025-2026-cue.ficheros/1075911-20250801%20Bolsa%20ordinaria%20provisional%20cuerpo%200590.pdf";
const AWARD_URL = "https://www.educa.jccm.es/es/bolsatra/bolsa-trabajo-secundaria-regimen-especial/adjudicacion-definitiva-centralizada-plazas-previa-inicio-4.ficheros/1077121-20250812%20Adjudicados%200590%20%E2%80%93%20Oposici%C3%B3n.pdf"; // Cambiar por URL real

const surnameInput = document.getElementById('surname');
const includeUnavailableInput = document.getElementById('includeUnavailable');
const includeAwardInput = document.getElementById('includeAward');
const resultDiv = document.getElementById('result');
const calculateBtn = document.getElementById('calculateBtn');

// Regex adaptado al PDF real (aprox.)  
// Debes ajustar si cambia el formato real: aquí tomamos: orden, apellidos y nombre, estado
const parserRegex = /^(?<order>\d+)\s+(?<surname>[\wÁÉÍÓÚáéíóúü]+\s[\wÁÉÍÓÚáéíóúü]+)\s+(?<name>[\wÁÉÍÓÚáéíóúü]+)\s+(?<status>DISPONIBLE|NO DISPONIBLE)/i;

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
        surname: match.groups.surname.trim(),
        name: match.groups.name.trim(),
        status: match.groups.status.toUpperCase()
      };
    }
    return null;
  }).filter(Boolean);
}

calculateBtn.addEventListener('click', async () => {
  const searchSurname = surnameInput.value.trim().toLowerCase();
  if (!searchSurname) {
    resultDiv.innerText = "Introduce tus apellidos.";
    return;
  }

  resultDiv.innerText = "Calculando...";

  try {
    let bagText = await readPdfFromUrl(BAG_URL);
    let bag = parseBag(bagText);

    if (includeAwardInput.checked) {
      try {
        let awardText = await readPdfFromUrl(AWARD_URL);
        let award = parseBag(awardText);
        bag = bag.concat(award);
      } catch {
        console.warn("No se pudo cargar adjudicación, se usará solo bolsa");
      }
    }

    if (!includeUnavailableInput.checked) {
      bag = bag.filter(row => row.status === 'DISPONIBLE');
    }

    const results = bag.filter(row => row.surname.toLowerCase() === searchSurname);

    if (results.length > 0) {
      let html = results.map(r => `Posición: <strong>${r.order}</strong> - ${r.surname} ${r.name} (${r.status})`).join('<br>');
      resultDiv.innerHTML = html;
    } else {
      resultDiv.innerText = "No se encontraron coincidencias para tus apellidos.";
    }

  } catch (err) {
    resultDiv.innerText = "Error leyendo los PDFs. Revisa la URL o tu conexión.";
    console.error(err);
  }
});
