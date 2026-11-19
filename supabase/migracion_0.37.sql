-- =====================================================================
-- Pippole 0.37 · Nombres de tienda sin marcas
-- Ejecutar una vez en Supabase → SQL Editor. Se puede repetir sin daño.
--
-- La regla de marca no deja mostrar marcas en la interfaz, y los nombres
-- de las tiendas las llevaban delante. Pasan a llamarse por la ciudad.
-- Solo se cambian las tiendas que siguen con el nombre original: si ya
-- habías puesto otro nombre a mano, se respeta.
-- Al importar personas, Pippole sigue reconociendo los nombres antiguos.
-- =====================================================================
with nuevos(codigo, nombre, antiguo) as (values
  ('ES001', 'San Sebastián de los Reyes', 'HOME & COOK S.SEBASTIAN REYES'),
  ('ES002', 'Getafe', 'HOME & COOK GETAFE'),
  ('ES003', 'Sevilla', 'HOME & COOK SEVILLA'),
  ('ES004', 'Bizkaia', 'HOME & COOK BIZKAIA'),
  ('ES006', 'Mallorca', 'HOME & COOK MALLORCA'),
  ('ES007', 'Tui', 'HOME & COOK TUI'),
  ('ES008', 'A Coruña', 'HOME & COOK A CORUÑA'),
  ('ES009', 'Las Rozas', 'HOME & COOK LAS ROZAS'),
  ('ES011', 'Viladecans', 'HOME & COOK VILADECANS'),
  ('ES012', 'Alicante', 'HOME & COOK ALICANTE'),
  ('ES014', 'Málaga', 'HOME & COOK MÁLAGA'),
  ('ES015', 'Zaragoza', 'HOME & COOK ZARAGOZA'),
  ('ES019', 'Mallorca 2', 'WMF MALLORCA'),
  ('ES020', 'San Sebastián de los Reyes 2', 'WMF S.SEBASTIAN REYES'),
  ('PT001', 'Porto', 'HOME & COOK PORTO'),
  ('PT002', 'Freeport', 'HOME & COOK FREEPORT'),
  ('PT003', 'Algarve', 'HOME & COOK ALGARVE'),
  ('PT004', 'Strada', 'TEFAL OUTLET STRADA'),
  ('PT005', 'Freeport 2', 'WMF FREEPORT'),
  ('PT006', 'Algarve 2', 'WMF ALGARVE'),
  ('PT008', 'Campera', 'TEFAL Campera')
)
update public.tiendas t
   set nombre = n.nombre
  from nuevos n
 where t.codigo = n.codigo
   and upper(trim(t.nombre)) = upper(n.antiguo);

-- Comprobación: debería salir 0.
select count(*) as tiendas_con_marca
  from public.tiendas
 where nombre ~* '(home ?& ?cook|wmf|tefal)';
