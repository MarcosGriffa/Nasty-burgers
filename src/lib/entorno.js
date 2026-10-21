/**
 * EN QUÉ VERSIÓN ESTAMOS
 *
 * El sistema del local y la web del cliente salen del mismo proyecto, pero no
 * tienen por qué viajar juntos.
 *
 * La web pública se va a publicar en internet: cualquiera la abre. No hay
 * razón para que el navegador de un cliente se descargue las pantallas de
 * caja, los costos, los proveedores y los arqueos. El login y las reglas de la
 * base ya impiden LEER los datos —eso está cubierto—, pero el código en sí
 * cuenta cómo funciona el negocio por dentro, y eso no se regala.
 *
 * Con VITE_SOLO_WEB=1 el panel directamente NO entra en el archivo: no es que
 * se esconde el botón, es que las pantallas no están. Se comprueba buscando
 * «Arqueos de caja» en el HTML generado: no tiene que aparecer.
 */
export const SOLO_WEB = import.meta.env.VITE_SOLO_WEB === '1'
