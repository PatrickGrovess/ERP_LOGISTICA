export const INVENTORY_UNITS = [
    { value: 'unit', label: 'Unidades' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'g', label: 'Gramos (g)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'l', label: 'Litros (L)' },
    { value: 'ml', label: 'Mililitros (mL)' },
    { value: 'box', label: 'Cajas' },
    { value: 'package', label: 'Paquetes' },
    { value: 'm', label: 'Metros (m)' },
];

const DISCRETE_UNITS = new Set(['unit', 'units', 'unidades', 'box', 'caja', 'package', 'paquete']);
const UNIT_DISPLAY = {
    unit: 'unidades', units: 'unidades', unidades: 'unidades',
    kg: 'kg', g: 'g', lb: 'lb', l: 'L', ml: 'mL', m: 'm',
    box: 'cajas', caja: 'cajas', package: 'paquetes', paquete: 'paquetes',
};

export const getInventoryUnitLabel = (unit) => {
    return UNIT_DISPLAY[unit] || unit || 'unidades';
};

export const isDiscreteInventoryUnit = (unit) => DISCRETE_UNITS.has(unit);
