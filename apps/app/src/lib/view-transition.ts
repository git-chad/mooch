type RouterLike = {
  push: (href: string) => void;
  replace?: (href: string) => void;
};

export function supportsViewTransitions() {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function navigateWithViewTransition(
  router: RouterLike,
  href: string,
  options?: {
    reducedMotion?: boolean;
    replace?: boolean;
  },
) {
  const navigate = () => {
    if (options?.replace && router.replace) {
      router.replace(href);
      return;
    }

    router.push(href);
  };

  if (options?.reducedMotion || !supportsViewTransitions()) {
    navigate();
    return;
  }

  document.startViewTransition?.(() => {
    navigate();
  });
}

export function getExpenseTransitionNames(expenseId: string) {
  return {
    icon: `expense-icon-${expenseId}`,
    title: `expense-title-${expenseId}`,
    amount: `expense-amount-${expenseId}`,
  } as const;
}
