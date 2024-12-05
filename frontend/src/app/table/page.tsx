import React, { useState } from "react";
import "./table.css";

interface TableProps {
  data: { member_id: string; username: string; email: string }[];
  onRowSelect: (selectedRow: { member_id: string; username: string; email: string } | null) => void;
  rowClassName?: (row: { member_id: string; username: string; email: string }) => string;
}

const Table: React.FC<TableProps> = ({ data, onRowSelect, rowClassName }) => {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const handleRowClick = (row: { member_id: string; username: string; email: string }) => {
    const newSelectedRow = selectedRow === row.member_id ? null : row.member_id;
    setSelectedRow(newSelectedRow);
    onRowSelect(newSelectedRow ? row : null);
  };

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
            <tr
              key={item.member_id}
              className={rowClassName ? rowClassName(item) : selectedRow === item.member_id ? "selected-row" : ""}
              onClick={() => handleRowClick(item)}
            >
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