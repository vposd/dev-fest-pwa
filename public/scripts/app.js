const vm = {
  container: document.querySelector('.container'),
  loader: document.querySelector('.loader'),
  dialog: document.querySelector('.dialog-container'),
  openDialog: document.querySelector('.open-dialog-button'),
  closeDialog: document.querySelector('.close-dialog-button'),
  addButton: document.querySelector('.add-button')
};

vm.closeDialog.addEventListener('click', () => toggleDialogVisible(false));
vm.openDialog.addEventListener('click', () => toggleDialogVisible(true));
vm.addButton.addEventListener('click', addServerData);

loadNetworkFirst();

//////////

function loadNetworkFirst() {
  return getServerData()
    .then(news => {
      updateUI(news);
      toggleLoaderHidden(true);
    });
}

// API

function getServerData() {
  return fetch('/api/getAll').then(response => response.json());
}

function addServerData() {
  const jsonDate = new Date();
  jsonDate.setHours(jsonDate.getHours() - jsonDate.getTimezoneOffset() / 60);

  const newsItem = {
    id: jsonDate.valueOf(),
    publishedAt: jsonDate.toJSON(),
  };
  const inputIds = ['author', 'title', 'description', 'url'];  
  inputIds.forEach(id => Object.assign(newsItem, { [id]: document.getElementById(id).value }));
  inputIds.forEach(id => document.getElementById(id).value = '');

  const headers = new Headers({ 'Content-Type': 'application/json' });        
  const body = JSON.stringify(newsItem);
  return fetch('/api/add', { method: 'POST', headers, body })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateUI([newsItem]);
        toggleDialogVisible(false);
      }
    });
}

// Storage

function getLastUpdated() {
  return localStorage.getItem('lastUpdated');
}

function setLastUpdated(date) {
  localStorage.setItem('lastUpdated', date);
}

function saveNewsDataLocally(news) { }

function getLocalNewsData() { }

// UI

function updateUI(news) {
  news.forEach(newsItem => {
    const date = newsItem.publishedAt.split('T')[0];
    const template = `
      <section class="card__primary">
        <h1 class="card__title"><a href="${newsItem.url}" aria-hidden="true" target="blank">${newsItem.title}</a></h1>
        <h2 class="card__subtitle">${newsItem.author}, ${date}</h2>
      </section>
      <section class="card__text">
        ${newsItem.description}
      </section>`;
    const eventItem = document.createElement('div');
    eventItem.classList.add('card');
    eventItem.innerHTML = template;
    vm.container.appendChild(eventItem);
  });
}

function toggleLoaderHidden(isHidden) {
  isHidden ? vm.loader.setAttribute('hidden', true) : vm.loader.removeAttribute('hidden');
}

function toggleDialogVisible(isVisible) {
  const visibilityClass = 'dialog-container--visible';
  isVisible ? vm.dialog.classList.add(visibilityClass) : vm.dialog.classList.remove(visibilityClass);
}

function showMessage(type, message) {
  // types: warn, error, success;
  const messageElement = document.getElementById('message');
  messageElement.className = `message bg-${type}`;
  messageElement.innerHTML = message;
}
