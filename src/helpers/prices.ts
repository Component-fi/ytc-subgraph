const ONE_YEAR_IN_SECONDS = 31560000;

export function calcFixedAPR(
  spotPrice: number,
  secondsUntilMaturity: number
): number {
  if (secondsUntilMaturity > 0) {
    const timeRemaining = secondsUntilMaturity / ONE_YEAR_IN_SECONDS;
    return ((1 - spotPrice) / spotPrice / timeRemaining) * 100;
  } else {
    return 0;
  }
}

export function calcSpotPricePt(
  baseReserves: string,
  ptReserves: string,
  totalSupply: string,
  timeRemainingSeconds: number,
  tParamSeconds: number,
  decimals: number
): number {
  // normalize decimal places of precision to 18
  if (decimals < 0 || decimals > 18) {
    // return 0 if decimals fall outside the range between 0 and 18
    return 0;
  }
  const diff = 18 - decimals;
  const normalizedBaseReserves = parseFloat(baseReserves) * 10 ** diff;
  const normalizedPtReserves = parseFloat(ptReserves) * 10 ** diff;

  const t = timeRemainingSeconds / tParamSeconds;
  return (normalizedBaseReserves / (normalizedPtReserves + parseFloat(totalSupply))) ** t;
}

export function calcSpotPriceYt(
  baseReserves: string,
  ytReserves: string
): number {
  return parseFloat(baseReserves) / parseFloat(ytReserves);
}