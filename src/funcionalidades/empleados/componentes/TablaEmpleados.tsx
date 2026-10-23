import { Link, useNavigate } from 'react-router-dom'
import { InsigniaEstado } from '@/compartido/componentes/InsigniaEstado'
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
    <div className="overflow-x-auto rounded-3xl border-2 border-pastel-lavanda bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-pastel-lavanda text-suave">
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Puesto</th>
            <th className="px-4 py-3 font-semibold">Modalidad</th>
            <th className="px-4 py-3 font-semibold">Tarifa</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((e) => (
            // Toda la fila lleva al detalle; el enlace del nombre se conserva para teclado y lectores de pantalla.
            <tr
              key={e.id}
              onClick={() => navegar(`/administradora/empleados/${e.id}`)}
              className="cursor-pointer border-b border-pastel-lavanda last:border-b-0 hover:bg-pastel-lavanda/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/administradora/empleados/${e.id}`}
                  onClick={(evento) => evento.stopPropagation()}
                  className="font-semibold text-violeta underline"
                >
                  {e.nombre_completo}
                </Link>
              </td>
              <td className="px-4 py-3">{e.puesto}</td>
              <td className="px-4 py-3">{e.tarifa_crc ? etiquetaModalidad(e.modalidad_pago) : 'Sin tarifa'}</td>
              <td className="px-4 py-3">
                {e.tarifa_crc ? `${formatoColones(e.tarifa_crc)} ${unidadModalidad(e.modalidad_pago)}` : '—'}
              </td>
              <td className="px-4 py-3">
                <InsigniaEstado activo={e.activo} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
