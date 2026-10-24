import { Link, useNavigate } from 'react-router-dom'
import { InsigniaEstado } from '@/compartido/componentes/InsigniaEstado'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { formatoColones } from '@/compartido/utilidades/formatoColones'
import {
  etiquetaModalidad,
  unidadModalidad,
  type ResumenEmpleado,
} from '@/funcionalidades/empleados/tipos'

interface Props {
  empleados: ResumenEmpleado[]
}

export function TablaEmpleados({ empleados }: Props) {
  const navegar = useNavigate()

  return (
    <TablaAdaptable encabezados={['Nombre', 'Puesto', 'Modalidad', 'Tarifa', 'Estado']} enmarcada>
      {empleados.map((e) => (
        // Toda la fila lleva al detalle; el enlace del nombre se conserva para teclado y lectores de pantalla.
        <FilaTabla key={e.id} alPulsar={() => navegar(`/administradora/empleados/${e.id}`)}>
          <CeldaTabla etiqueta="Nombre">
            <Link
              to={`/administradora/empleados/${e.id}`}
              onClick={(evento) => evento.stopPropagation()}
              className="font-semibold text-violeta underline"
            >
              {e.nombre_completo}
            </Link>
          </CeldaTabla>
          <CeldaTabla etiqueta="Puesto">{e.puesto}</CeldaTabla>
          <CeldaTabla etiqueta="Modalidad">
            {e.tarifa_crc ? etiquetaModalidad(e.modalidad_pago) : 'Sin tarifa'}
          </CeldaTabla>
          <CeldaTabla etiqueta="Tarifa">
            {e.tarifa_crc ? `${formatoColones(e.tarifa_crc)} ${unidadModalidad(e.modalidad_pago)}` : '—'}
          </CeldaTabla>
          <CeldaTabla etiqueta="Estado">
            <InsigniaEstado activo={e.activo} />
          </CeldaTabla>
        </FilaTabla>
      ))}
    </TablaAdaptable>
  )
}
