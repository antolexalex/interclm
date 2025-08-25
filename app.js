const BAG_ORD_URL = "./ordinaria.pdf";
const BAG_RES_URL = "./reserva.pdf";
const AWARD_URL = "./adjudicados.pdf"; // opcional

const surnameInput = document.getElementById('surname');
const includeUnavailableInput = document.getElementById('includeUnavailable');
const includeAwardInput = document.getElementById('includeAward');
const resultDiv = document.getElementById('result');
const calculateBtn = document.getElementById('calculateBtn');

// Regex adaptado al PDF real: orden, apellidos, nombre, estado
const parserRegex = /^(?<order>\d+)\s+(?<surname>[\wÁÉÍÓÚáéíóúü]+\s[\wÁÉÍÓÚáéíóúü]+)\s+(?<name>[\wÁÉÍÓÚáéíóúü]+)\s+(?<status>DISPONIBLE|NO DISPONIBLE)/i;

async function readPdf(fileUrl) {
  const data = await fetch(fileUrl).then(res => res.arrayBuffer());
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
    // Leer bolsas
    let ordinariaText = await readPdf(BAG_ORD_URL);
    let reservaText = await readPdf(BAG_RES_URL);

    let ordinaria = parseBag(ordinariaText);
    let reserva = parseBag(reservaText);

    // Filtrar NO disponibles si no se incluye
    if (!includeUnavailableInput.checked) {
      ordinaria = ordinaria.filter(r => r.status === 'DISPONIBLE');
      reserva = reserva.filter(r => r.status === 'DISPONIBLE');
    }

    // Concatenamos ordinaria + reserva
    let bag = ordinaria.concat(reserva);

    // Añadimos adjudicación si se desea
    if (includeAwardInput.checked) {
      try {
        let awardText = await readPdf(AWARD_URL);
        let award = parseBag(awardText);
        if (!includeUnavailableInput.checked) {
          award = award.filter(r => r.status === 'DISPONIBLE');
        }
        bag = bag.concat(award);
      } catch {
        console.warn("No se pudo cargar adjudicación, se usará solo bolsa");
      }
    }

    // Buscar coincidencias por apellidos
    const results = bag
      .map((r, index) => ({ ...r, finalPosition: index + 1 }))
      .filter(r => r.surname.toLowerCase() === searchSurname);

    if (results.length > 0) {
      let html = results.map(r => `Posición: <strong>${r.finalPosition}</strong> - ${r.surname} ${r.name} (${r.status})`).join('<br>');
      resultDiv.innerHTML = html;
    } else {
      resultDiv.innerText = "No se encontraron coincidencias para tus apellidos.";
    }

  } catch (err) {
    resultDiv.innerText = "Error leyendo los PDFs. Revisa la conexión o los archivos.";
    console.error(err);
  }
});

