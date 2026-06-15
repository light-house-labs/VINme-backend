export async function decodeVIN(vin: string) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
  const res = await fetch(url);
  const data = await res.json();

  const get = (var_: string) =>
    data.Results?.find((r: any) => r.Variable === var_)?.Value ?? null;

  return {
    vin,
    year: parseInt(get('Model Year')) || null,
    make: get('Make'),
    model: get('Model'),
    trim: get('Trim'),
    engine: `${get('Displacement (L)')}L ${get('Engine Configuration')}`,
    drivetrain: get('Drive Type'),
    bodyType: get('Body Class'),
    fuelType: get('Fuel Type - Primary'),
    raw: data.Results,
  };
}
