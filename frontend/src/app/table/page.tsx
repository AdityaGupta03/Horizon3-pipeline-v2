import React from "react";
import "./table.css";

interface TableProps {
  data: { member_id: string; username: string; email: string }[];
}

const Table: React.FC<TableProps> = ({ data }) => {
  return (
    <div className="table-container">
      <table className="styled-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.member_id}>
              <td>{item.member_id}</td>
              <td>{item.username}</td>
              <td>{item.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;