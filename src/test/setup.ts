// Calendar days and every formatted date depend on the zone; pin it so a CI runner in UTC sees what a Brazilian browser sees.
process.env.TZ = 'America/Sao_Paulo';
import '@testing-library/jest-dom';
