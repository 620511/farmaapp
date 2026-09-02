const { haversineDistanceKm, calculateDeliveryFee } = require('../src/utils/geo');

describe('haversineDistanceKm', () => {
  it('retorna ~0 para o mesmo ponto', () => {
    const d = haversineDistanceKm(-3.7319, -38.5267, -3.7319, -38.5267);
    expect(d).toBeCloseTo(0, 3);
  });

  it('calcula uma distância aproximada entre dois pontos conhecidos', () => {
    // Fortaleza -> Aquiraz (~cerca de 25-30km em linha reta)
    const d = haversineDistanceKm(-3.7319, -38.5267, -3.9014, -38.3911);
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(40);
  });
});

describe('calculateDeliveryFee', () => {
  it('é grátis quando o subtotal é alto', () => {
    expect(calculateDeliveryFee(10, 100)).toBe(0);
  });

  it('cobra a taxa base dentro da franquia de km', () => {
    expect(calculateDeliveryFee(1, 20)).toBe(4.9);
  });

  it('usa o valor fixo de fallback quando não há distância', () => {
    expect(calculateDeliveryFee(null, 20)).toBe(7.9);
  });

  it('nunca ultrapassa o teto máximo', () => {
    expect(calculateDeliveryFee(100, 20)).toBeLessThanOrEqual(24.9);
  });
});
