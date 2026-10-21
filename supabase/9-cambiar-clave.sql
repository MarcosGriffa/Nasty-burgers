-- ---------------------------------------------------------------------------
-- CAMBIAR LA CONTRASEÑA DE UN EMPLEADO
--
-- Para cuando no te acordás la clave de benavidez@ o escobar@ y querés poner
-- una nueva sin depender del mail (el dominio nastyburgers.com no manda mails,
-- así que el "Reset password" que manda un correo no sirve acá).
--
-- Se corre en Supabase → SQL Editor. Cambiá las DOS cosas marcadas abajo y
-- dale Run. Después entrás a https://nasty-sistema.netlify.app con esa clave.
--
-- La contraseña NO se guarda como la escribís: Postgres la pasa por bcrypt y
-- guarda el hash, que es lo mismo que hace Supabase cuando la creás a mano.
-- Probado contra un Postgres de verdad: el hash queda en formato $2a$ de 60
-- caracteres y valida con la clave nueva y solo con esa.
--
-- Poné una clave larga y que no uses en otro lado. No hace falta que me la
-- pases por chat, ni a mí ni a nadie: la ponés acá y listo.
-- ---------------------------------------------------------------------------

update auth.users
set encrypted_password = extensions.crypt(
      'PONE-ACA-LA-CLAVE-NUEVA',   -- ← 1) la clave nueva, entre comillas simples
      extensions.gen_salt('bf')
    ),
    updated_at = now()
where email = 'benavidez@nastyburgers.com';  -- ← 2) a quién le cambiás la clave

-- Para ver que salió bien (tiene que decir 1 fila y una fecha de recién):
select email, updated_at
from auth.users
where email in ('benavidez@nastyburgers.com', 'escobar@nastyburgers.com');
