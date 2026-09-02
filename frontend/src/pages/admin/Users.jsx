import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const roleLabel = { ADMIN: 'Administrador', PHARMACY: 'Farmácia', CUSTOMER: 'Cliente' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get('/admin/users').then((r) => setUsers(r.data)); }, []);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-6">Usuários</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-navy-900/50 text-left">
            <tr><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Perfil</th><th className="p-3">Desde</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="p-3 font-medium text-navy-900">{u.name}</td>
                <td className="p-3 text-navy-900/60">{u.email}</td>
                <td className="p-3">{roleLabel[u.role]}</td>
                <td className="p-3 text-navy-900/50">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
