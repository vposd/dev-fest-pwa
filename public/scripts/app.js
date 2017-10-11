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

window.addEventListener('online', () => {
  vm.container.innerHTML = '';
  loadNetworkFirst();
});

//////////

function loadNetworkFirst() {
  return getServerData()
    .then(news => {
      updateUI(news);
      toggleLoaderHidden(true);
      saveNewsDataLocally(news)
        .then(() => {
          setLastUpdated(new Date());
          showMessage('success', 'Данные сохранены для работы в оффлайне');
        })
        .catch(() => {
          showMessage('error', 'Чёта данные не могут быть сохранены :(');
        });
    }, error => {
      console.log('Запрос к бэкенду упал, возможно мы оффлайн...', error);
      toggleLoaderHidden(true);
      getLocalNewsData()
        .then(offlineNews => {
          if (!offlineNews.length) {
            showMessage('warn', 'Вы работаете оффлайн, cохраненных данных нет');
          } else {
            showMessage('warn', 'Вы работаете оффлайн, и просматриваете сохраненные данные от ' + getLastUpdated());
            updateUI(offlineNews);
          }
        }).catch(e => console.error(e))
    })
    .then(() => navigator.serviceWorker.ready)
    .then(registration => registration.sync.register('outbox'));
}

// API

function getServerData() {
  return fetch('/api/getAll').then(response => response.json());
}

function addServerData() {
  const jsonDate = new Date();
  jsonDate.setHours(jsonDate.getHours() - jsonDate.getTimezoneOffset() / 60);

  const data = {
    id: jsonDate.valueOf(),
    publishedAt: jsonDate.toJSON(),
  };
  const inputIds = ['author', 'title', 'description', 'url'];  
  inputIds.forEach(id => Object.assign(data, { [id]: document.getElementById(id).value }));
  inputIds.forEach(id => document.getElementById(id).value = '');

  updateUI([data]);
  saveNewsDataLocally([data]);
  toggleDialogVisible(false);

  store.outbox('readwrite')
    .then(outbox => outbox.put(data))
    .then(() => navigator.serviceWorker.ready)
    .then(registration => registration.sync.register('outbox'));
}

// Storage

function getLastUpdated() {
  return localStorage.getItem('lastUpdated');
}

function setLastUpdated(date) {
  localStorage.setItem('lastUpdated', date);
}

function saveNewsDataLocally(news) {
  return store.news('readwrite')
    .then(newsStore => {
      return Promise.all(news.map(newsItem => newsStore.put(newsItem)))
        .catch(() => {
          tx.abort();
          throw Error('News were not added to the store');
        });
    });
}

function getLocalNewsData() {
  return store.news('readonly').then(newsStore => newsStore.getAll());
}

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
