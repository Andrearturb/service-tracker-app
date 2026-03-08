import { useEffect, useState } from "react";

function App() {
  const [services, setServices] = useState([]);
  const [uploadDate, setUploadDate] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/services")
      .then((response) => response.json())
      .then((data) => {
        setServices(data.dados);
        setUploadDate(data.upload_data);
      })
      .catch((error) => console.error("Erro ao buscar dados:", error));
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Service Tracker</h1>

      {uploadDate && (
        <p>
          Última atualização: {new Date(uploadDate).toLocaleString()}
        </p>
      )}

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Status</th>
            <th>Loja</th>
            <th>Praça</th>
            <th>Descrição</th>
          </tr>
        </thead>

        <tbody>
          {services.map((service) => (
            <tr key={service.ticket}>
              <td>{service.ticket}</td>
              <td>{service.status}</td>
              <td>{service.store_name}</td>
              <td>{service.praca}</td>
              <td>{service.service_description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App; 