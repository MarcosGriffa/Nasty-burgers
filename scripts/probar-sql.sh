#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Prueba los SQL de supabase/ contra un Postgres de verdad, descartable.
#
# Por qué existe: se le mandó a Marcos un `0-verificar.sql` que no corría,
# porque nombraba una columna que todavía no existía —justo la que venía a
# verificar—. Postgres revisa TODAS las columnas antes de ejecutar, así que un
# SQL que "parece bien" puede reventar en la base del local. Mandar un archivo
# sin probarlo es hacerle perder el tiempo a alguien que está atendiendo.
#
# Qué hace:
#   1. Levanta un Postgres vacío en un directorio temporal.
#   2. Reconstruye la base como quedó el 13/10 (esquema + columnas + datos).
#   3. Corre los archivos sueltos (4, 5, 6, 7, 8) en orden.
#   4. Los corre OTRA VEZ, para confirmar que se pueden repetir sin romper.
#   5. Muestra cómo quedaron las formas de cobro.
#
# Uso:  bash scripts/probar-sql.sh
# ---------------------------------------------------------------------------
set -u

BIN=/usr/lib/postgresql/16/bin
USUARIO=pgtest
DIR=/home/$USUARIO/pg-prueba
PUERTO=55432
REPO="$(cd "$(dirname "$0")/.." && pwd)"

command -v "$BIN/initdb" >/dev/null || { echo "Falta Postgres 16 (apt install postgresql-16)"; exit 1; }
id "$USUARIO" >/dev/null 2>&1 || useradd -m "$USUARIO"

echo "· Levantando un Postgres descartable…"
rm -rf "$DIR"; mkdir -p "$DIR"; chown -R "$USUARIO":"$USUARIO" "/home/$USUARIO"
su "$USUARIO" -c "$BIN/initdb -D $DIR/data -U postgres -A trust" >/dev/null 2>&1
su "$USUARIO" -c "$BIN/pg_ctl -D $DIR/data -l $DIR/log -o '-k $DIR -p $PUERTO -c listen_addresses=' -w start" >/dev/null 2>&1 \
  || { echo "No arrancó. Mirá $DIR/log"; exit 1; }

psql() { command psql -h "$DIR" -p "$PUERTO" -U postgres "$@"; }
limpiar() { su "$USUARIO" -c "$BIN/pg_ctl -D $DIR/data stop" >/dev/null 2>&1; }
trap limpiar EXIT

psql -q -c "create database nasty" -d postgres
# Supabase trae estos roles y funciones de fábrica; acá hay que fingirlos para
# que las reglas de seguridad de 1-esquema.sql se puedan crear.
psql -q -d nasty -c "
  create role anon; create role authenticated; create role service_role;
  create schema if not exists auth;
  create or replace function auth.uid()  returns uuid  language sql as \$\$ select null::uuid \$\$;
  create or replace function auth.jwt()  returns jsonb language sql as \$\$ select '{}'::jsonb \$\$;"

correr() { # archivo, etiqueta
  local salida
  salida=$(psql -q -d nasty -f "$REPO/supabase/$1" 2>&1 \
    | grep -iE "ERROR" | grep -v "supabase_realtime")
  if [ -n "$salida" ]; then
    echo "  ✗ $1"; echo "$salida" | sed 's/^/      /'; FALLO=1
  else
    echo "  ✓ $1"
  fi
}

FALLO=0
echo "· Base como quedó el 13/10:"
for f in 1-esquema 2-columnas 3-datos; do correr "$f.sql"; done

echo "· Archivos sueltos, primera pasada:"
for f in 4-sacar-sin-que 5-sacar-promo-melt 6-fotos 7-arqueo 8-tarjeta-credito; do correr "$f.sql"; done

echo "· Y otra vez, que se tienen que poder repetir:"
for f in 4-sacar-sin-que 5-sacar-promo-melt 6-fotos 7-arqueo 8-tarjeta-credito; do correr "$f.sql"; done

echo "· La verificación:"
psql -d nasty -f "$REPO/supabase/0-verificar.sql" 2>&1 | sed 's/^/  /'

echo "· Formas de cobro como quedaron:"
psql -tA -d nasty -c "
  select '  ' || nombre || ' · clave=' || coalesce(clave,'(ninguna)')
         || ' · origen=' || coalesce(origen,'-')
         || ' · comision=' || coalesce(comision::text,'sin cargar')
  from medios_pago order by nombre"

[ "$FALLO" = 0 ] && echo "· Todo bien." || { echo "· HUBO ERRORES."; exit 1; }
