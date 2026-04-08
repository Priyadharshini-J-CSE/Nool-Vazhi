const getPricingEstimate = (req, res) => {
  const { bundles, season } = req.query;
  const b = Number(bundles) || 1;

  const multipliers = { peak: 1.2, festival: 1.5, monsoon: 1.8, offpeak: 0.9, normal: 1.0 };
  const multiplier = multipliers[season] || 1.0;

  const baseCost = 1500;
  const perBundle = 200 * b;
  const poolDiscount = b >= 5 ? 0.15 : b >= 3 ? 0.10 : 0.05;
  const subtotal = (baseCost + perBundle) * multiplier;
  const discount = subtotal * poolDiscount;

  res.json({
    baseCost: Math.round(baseCost * multiplier),
    perBundle: Math.round(perBundle * multiplier),
    poolDiscount: Math.round(discount),
    total: Math.round(subtotal - discount),
    multiplier,
    season: season || 'normal',
    routes: [
      { route: 'Mumbai → Pune', regular: 3500, pooled: 2800, savings: 700 },
      { route: 'Delhi → Jaipur', regular: 4200, pooled: 3360, savings: 840 },
      { route: 'Chennai → Bangalore', regular: 3800, pooled: 3040, savings: 760 },
      { route: 'Hyderabad → Mumbai', regular: 6500, pooled: 5200, savings: 1300 },
      { route: 'Kolkata → Patna', regular: 2800, pooled: 2240, savings: 560 },
    ],
  });
};

module.exports = { getPricingEstimate };
