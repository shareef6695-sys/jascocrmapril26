export const isSalesRepRole = (role) =>
  ["staff"].includes(role);

export const isManagerRole = (role) =>
  ["manager", "supervisor", "head"].includes(role);

export const isCompanyRole = (role) => ["director", "admin"].includes(role);

export const canViewOwnForecast = (user) => Boolean(user?.id);

export const canViewTeamForecast = (user) => isManagerRole(user?.role) || isCompanyRole(user?.role);

export const canViewCompanyForecast = (user) => isCompanyRole(user?.role);

export const canViewRepForecast = (user, repId) => {
  if (!user?.id || !repId) return false;
  if (user.id === repId) return true;
  return canViewTeamForecast(user) || canViewCompanyForecast(user);
};

export const getForecastScope = (user) => {
  if (isCompanyRole(user?.role)) return "company";
  if (isManagerRole(user?.role)) return "team";
  return "own";
};

export const canViewRiskDeals = (user, scope) => {
  const effectiveScope = scope || getForecastScope(user);
  if (effectiveScope === "company") return canViewCompanyForecast(user);
  if (effectiveScope === "team") return canViewTeamForecast(user);
  return canViewOwnForecast(user);
};
