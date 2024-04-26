type TStore = {
  env: {
    WORKDIR: string;
  }
}
class Store<T extends object> {
  state: T = {} as T;
}

const store = new Store<TStore>();
export default store;