import { createApp } from 'vue'

const ws = new WebSocket('ws://localhost:9001');

ws.onopen = () => {
  console.log('WebSocket Connected');
}

ws.onmessage = (event) => {
  console.log('WebSocket Message:', event.data);
}

ws.onclose = () => {
  console.log('WebSocket Closed');
}

const app = createApp({
  template: /*html*/ `
    <div class="m-1rem">
      <h1>Create Game Session</h1>
      <form class="mt-1rem" @submit.prevent="createGameSession">
        <table>
          <thead>
            <tr>
              <th>Game Property Key</th>
              <th>Game Property Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gameProperty in gameProperties">
              <td><input type="text" v-model="gameProperty.key" required></td>
              <td><input type="text" v-model="gameProperty.value" required></td>
            </tr>
            <tr>
              <td colspan="2">
                <button type="button" class="w-100p" @click="addGameProperty">Add Game Property</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="mt-1rem">
          <button type="submit" >Create Game Session</button>
        </div>
      </form>
    </div>
  `,
  data() {
    return {
      gameProperties: [
        { key: '', value: ''}
      ]
    }
  },
  watch: {
    gameProperties: {
      deep: true,
      handler() {
        localStorage.setItem('GameLiftLocal-gameProperties', JSON.stringify(this.gameProperties));
      }
    }
  },
  methods: {
    addGameProperty() {
      this.gameProperties.push({ key: '', value: '' });
    },
    createGameSession() {
      ws.send(JSON.stringify({
        Action: 'CreateGameSession',
        RequestId: crypto.randomUUID(),
        GameProperties: this.gameProperties.map(({ key, value }) => ({ [key]: value })).reduce((a, b) => ({ ...a, ...b }), {})
      }));
    }
  },
  mounted() {
    const gameProperties = localStorage.getItem('GameLiftLocal-gameProperties');
    if (gameProperties) {
      this.gameProperties = JSON.parse(gameProperties);
    }
  }
});

app.mount('#app');
