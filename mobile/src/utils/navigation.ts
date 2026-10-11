type Pushable = {
  push: (href: never) => void;
};

/** Contourne les routes typées Expo tant que le cache `.expo` n'est pas régénéré. */
export function pushPath(
  router: Pushable,
  pathname: string,
  params?: Record<string, string | undefined>
) {
  if (params) {
    router.push({ pathname, params } as never);
    return;
  }
  router.push(pathname as never);
}
