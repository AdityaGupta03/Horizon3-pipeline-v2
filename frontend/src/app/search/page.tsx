import React, { useState, useEffect } from "react";
import "./search.css";

interface SearchProps {
  onSelectItem: (item: { id: string; name: string; email?: string }) => void;
  searchType: "users" | "teams";
}

const Search: React.FC<SearchProps> = ({ onSelectItem, searchType }) => {
  const [query, setQuery] = useState<string>("");
  const [allItems, setAllItems] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [filteredResults, setFilteredResults] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        const endpoint = searchType === "users" ? "/api/user/get_all_users" : "/api/team/get_all_teams";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (response.ok) {
          const items = searchType === "users" ? data.users.map((user: any) => ({ id: user.user_id, name: user.username, email: user.email })) : data.teams.map((team: any) => ({ id: team.team_id, name: team.team_name }));
          setAllItems(items);
        }
      } catch (error) {
        console.error(`Error fetching all ${searchType}:`, error);
      }
    };

    fetchAllItems();
  }, [searchType]);

  useEffect(() => {
    if (query === "") {
      setFilteredResults([]);
    } else {
      const results = allItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(results);
    }
  }, [query, allItems]);

  const handleItemClick = (item: { id: string; name: string; email?: string }) => {
    setSelectedItem(item);
    onSelectItem(item);
  };

  return (
    <div className="search-container">
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search for a ${searchType === "users" ? "user" : "team"} by name`}
          className="search-input"
        />
      </div>
      <div>
        <ul className="search-results">
          {filteredResults.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={selectedItem?.id === item.id ? "selected-user" : ""}
            >
              {item.name} {item.email && `(${item.email})`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Search;
