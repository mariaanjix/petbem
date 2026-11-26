/* Heurísticas 1, 5 e 9: feedback claro, prevenção de erros e correção orientada. */
// Conteudo editavel em data.js: servicos, horarios, contato e perguntas frequentes.
function loadSiteData() {
  const data = window.SITE_DATA;
  if (!data) return;
  if (data.nome) {
    document.querySelectorAll('.brand').forEach(el => el.replaceChildren(document.createTextNode(`${data.nome} `)));
    document.title = `${data.nome} — cuidado pertinho de você`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Agende serviços para seu pet na ${data.nome} de forma simples e rápida.`);
  }
  if (data.servicos?.length) document.querySelectorAll('.service-card').forEach((card, i) => {
    const item = data.servicos[i]; if (!item) { card.hidden = true; return; }
    card.hidden = false; card.dataset.service = item.nome;
    card.setAttribute('aria-label', `Agendar ${item.nome}, a partir de ${item.preco}`);
    const parts = card.children;
    parts[0].textContent = item.icone; parts[1].textContent = item.nome; parts[2].textContent = item.descricao;
    parts[3].textContent = `⏱ ${item.duracao}`; parts[4].innerHTML = `A partir de <strong>${item.preco}</strong>`;
    const choice = document.querySelectorAll('.choice')[i];
    if (choice) { choice.dataset.service = item.nome; choice.replaceChildren(document.createTextNode(`${item.icone} ${item.nome}`)); }
  });
  if (data.horariosDisponiveis?.length) {
    const grid = document.querySelector('.time-grid');
    grid.replaceChildren(...data.horariosDisponiveis.map(time => {
      const button = document.createElement('button'); button.className = 'time-choice'; button.type = 'button';
      button.setAttribute('role', 'radio'); button.setAttribute('aria-checked', 'false'); button.textContent = time; return button;
    }));
  }
  if (data.perguntas?.length) {
    const grid = document.querySelector('.faq-grid');
    grid.replaceChildren(...data.perguntas.map(item => {
      const details = document.createElement('details'), summary = document.createElement('summary'), answer = document.createElement('p');
      summary.textContent = item.pergunta; answer.textContent = item.resposta; details.append(summary, answer); return details;
    }));
  }
  const address = document.querySelector('.contact-details p:nth-child(1) span:last-child');
  if (address && data.endereco) address.innerHTML = `<strong>Endereço</strong>${data.endereco}`;
  const hours = document.querySelector('.contact-details p:nth-child(2) span:last-child');
  if (hours && data.horario) hours.innerHTML = `<strong>Horário</strong>${data.horario}`;
  const phone = document.querySelector('.contact-details p:nth-child(3) span:last-child');
  if (phone && data.whatsapp) { const digits = data.whatsapp.replace(/\D/g, '').slice(-11); phone.innerHTML = `<strong>WhatsApp</strong>(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`; }
  if (data.whatsapp) document.querySelector('.contact-copy .button')?.setAttribute('href', `https://wa.me/${data.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20${encodeURIComponent(data.nome || 'PetBem')}!%20Tenho%20uma%20d%C3%BAvida.`);
}
loadSiteData();
const form = document.querySelector('#booking-form');
const dialog = document.querySelector('#review-dialog');
const state = { service: '', time: '' };
const fields = {
  pet: document.querySelector('#pet-name'),
  date: document.querySelector('#date'),
  tutor: document.querySelector('#tutor-name'),
  phone: document.querySelector('#phone')
};
const reviewButton = document.querySelector('#review-button');
const status = document.querySelector('#form-status');
const dateInput = fields.date;

// Datas passadas e domingos são bloqueados na interface e também validados antes da revisão.
function localISODate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
dateInput.min = localISODate(new Date());

function setError(key, message) {
  const input = fields[key];
  const error = document.querySelector(`#${key}-error`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  error.textContent = message ? `⚠ ${message}` : '';
}
function dateError() {
  if (!dateInput.value) return 'Escolha uma data para continuar.';
  const date = new Date(`${dateInput.value}T12:00:00`);
  if (dateInput.value < dateInput.min) return 'Essa data já passou. Escolha hoje ou um próximo dia.';
  if (date.getDay() === 0) return 'A PetBem fecha aos domingos. Escolha de segunda a sábado.';
  return '';
}
function validPhone() { return fields.phone.value.replace(/\D/g, '').length === 11; }
function errors() {
  const result = {};
  if (!state.service) result.service = 'Escolha Banho, Tosa ou Vacina.';
  if (fields.pet.value.trim().length < 2) result.pet = 'Digite o nome do seu pet, por exemplo: Thor.';
  result.date = dateError();
  if (!state.time) result.time = 'Escolha um dos horários disponíveis.';
  if (fields.tutor.value.trim().length < 2) result.tutor = 'Digite seu nome, por exemplo: Ana.';
  if (!validPhone()) result.phone = 'Digite um WhatsApp com DDD, por exemplo: (11) 98765-4321.';
  return result;
}
function update() {
  const currentErrors = errors();
  const ready = Object.keys(currentErrors).length === 0;
  reviewButton.disabled = !ready;
  status.textContent = ready ? '✓ Tudo preenchido! Você já pode revisar seu agendamento.' : `Falta preencher: ${Object.values(currentErrors).join(' ')}`;
  status.classList.toggle('is-ready', ready);
  document.querySelector('#service-error').textContent = currentErrors.service ? `⚠ ${currentErrors.service}` : '';
  document.querySelector('#time-error').textContent = currentErrors.time ? `⚠ ${currentErrors.time}` : '';
  for (const key of ['pet', 'date', 'tutor', 'phone']) setError(key, currentErrors[key] || '');
}

function chooseService(service) {
  state.service = state.service === service ? '' : service;
  document.querySelectorAll('.choice').forEach(button => button.setAttribute('aria-checked', String(button.dataset.service === state.service)));
  update();
}
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => chooseService(button.dataset.service)));
// Heurística 7: os cartões levam ao formulário com o serviço escolhido.
document.querySelectorAll('.service-card').forEach(card => card.addEventListener('click', () => {
  state.service = card.dataset.service;
  document.querySelectorAll('.choice').forEach(button => button.setAttribute('aria-checked', String(button.dataset.service === state.service)));
  document.querySelector('#agendar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  update();
  window.setTimeout(() => document.querySelector('.choice[aria-checked="true"]')?.focus(), 250);
}));
document.querySelectorAll('.time-choice').forEach(button => button.addEventListener('click', () => {
  state.time = state.time === button.textContent ? '' : button.textContent;
  document.querySelectorAll('.time-choice').forEach(item => item.setAttribute('aria-checked', String(item.textContent === state.time)));
  update();
}));

// Navegação por setas para grupos de opções, além de Tab e Enter/Espaço nativos dos botões.
document.querySelectorAll('[role="radiogroup"]').forEach(group => group.addEventListener('keydown', event => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
  const options = [...group.querySelectorAll('[role="radio"]')];
  const index = options.indexOf(document.activeElement);
  if (index < 0) return;
  event.preventDefault();
  options[(index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
}));

// Máscara de telefone com atualização imediata e limite de onze dígitos.
fields.phone.addEventListener('input', () => {
  const digits = fields.phone.value.replace(/\D/g, '').slice(0, 11);
  fields.phone.value = digits.length > 10 ? digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '') : digits.length > 6 ? digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '') : digits.length > 2 ? digits.replace(/^(\d{2})(\d{0,5})/, '($1) $2') : digits.length ? `(${digits}` : '';
  update();
});
Object.values(fields).filter(field => field !== fields.phone).forEach(field => field.addEventListener('input', update));
dateInput.addEventListener('change', update);

const prettyDate = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`));
function getSummary() {
  return { 'Serviço': state.service, 'Pet': fields.pet.value.trim(), 'Data': prettyDate(fields.date.value), 'Horário': state.time, 'Tutor': fields.tutor.value.trim(), 'WhatsApp': fields.phone.value };
}
function fillSummary(target, summary) {
  target.replaceChildren();
  Object.entries(summary).forEach(([label, value]) => {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value;
    target.append(dt, dd);
  });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!reviewButton.disabled) {
    fillSummary(document.querySelector('#review-summary'), getSummary());
    dialog.showModal();
    document.querySelector('[data-close]').focus();
  } else {
    const firstInvalid = form.querySelector('[aria-invalid="true"]') || document.querySelector('.choice[aria-checked="false"]');
    firstInvalid?.focus();
  }
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { if (!document.querySelector('#success-screen').hidden) return; reviewButton.focus(); });

// Heurística 1: estado breve de carregamento simulado antes da confirmação final.
document.querySelector('#confirm-button').addEventListener('click', event => {
  const button = event.currentTarget;
  const summary = getSummary();
  button.disabled = true;
  button.classList.add('loading');
  button.textContent = 'Confirmando seu agendamento…';
  window.setTimeout(() => {
    const now = new Date();
    const protocol = `PB-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    document.querySelector('#protocol').textContent = protocol;
    fillSummary(document.querySelector('#success-summary'), summary);
    const start = new Date(`${fields.date.value}T${state.time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const eventText = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${protocol}@petbem.example\nDTSTAMP:${stamp(new Date())}\nDTSTART:${stamp(start)}\nDTEND:${stamp(end)}\nSUMMARY:${encodeURIComponent(`${state.service} para ${fields.pet.value.trim()} — PetBem`)}\nDESCRIPTION:${encodeURIComponent(`Agendamento PetBem. Tutor: ${fields.tutor.value.trim()}. Protocolo: ${protocol}.`)}\nEND:VEVENT\nEND:VCALENDAR`;
    const calendar = document.querySelector('#calendar-link');
    calendar.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(eventText)}`;
    calendar.download = `petbem-${protocol}.ics`;
    dialog.close();
    const success = document.querySelector('#success-screen');
    success.hidden = false;
    document.body.style.overflow = 'hidden';
    success.focus();
    button.disabled = false; button.classList.remove('loading'); button.innerHTML = 'Confirmar agendamento <span aria-hidden="true">✓</span>';
  }, 750);
});
document.querySelector('#new-booking').addEventListener('click', () => {
  document.querySelector('#success-screen').hidden = true;
  document.body.style.overflow = '';
  form.reset(); state.service = ''; state.time = '';
  document.querySelectorAll('.choice,.time-choice').forEach(option => option.setAttribute('aria-checked', 'false'));
  update();
  document.querySelector('#agendar').scrollIntoView({ behavior: 'smooth' });
  document.querySelector('.choice').focus();
});
update();
