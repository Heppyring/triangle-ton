import { useEffect, useState } from "react";
import Tree from "react-d3-tree";

function App() {
  const [treeData, setTreeData] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // 🔥 LIVE UPDATE
  useEffect(() => {
    load();

    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  function load() {
    fetch("https://triangle-ton.onrender.com/slots")
      .then(res => res.json())
      .then(data => {
        setRawData(data);

        const root = buildTree(data);
        setTreeData(root);

        buildLeaderboard(data);
      });
  }

  // 🌳 TREE
  function buildTree(data) {
    const map = {};

    data.forEach(n => {
      map[n.id] = {
        name: n.user_id,
        attributes: {
          id: n.id,
          earnings: n.earnings,
          closed: n.closed,
          total: 0
        },
        children: []
      };
    });

    let root = null;

    data.forEach(n => {
      if (!n.parent_id) root = map[n.id];
      else {
        const p = map[n.parent_id];
        if (p) p.children.push(map[n.id]);
      }
    });

    calcTotal(root);
    return root;
  }

  function calcTotal(node) {
    let total = node.attributes.earnings;

    node.children?.forEach(c => {
      total += calcTotal(c);
    });

    node.attributes.total = total;
    return total;
  }

  // 🏆 LEADERBOARD
  function buildLeaderboard(data) {
    const users = {};

    data.forEach(n => {
      if (!users[n.user_id]) {
        users[n.user_id] = 0;
      }
      users[n.user_id] += n.earnings;
    });

    const sorted = Object.entries(users)
      .map(([user, total]) => ({ user, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setLeaderboard(sorted);
  }

  // 🎯 CLICK
  function handleClick(node) {
    setSelectedNode(node);
  }

  const renderNode = ({ nodeDatum }) => (
    <g onClick={() => handleClick(nodeDatum)}>
      <circle
        r="24"
        fill={nodeDatum.attributes.closed ? "#00ff88" : "#ff9800"}
        style={{
          cursor: "pointer",
          transition: "0.3s",
          filter: "drop-shadow(0 0 6px rgba(0,255,150,0.6))"
        }}
      />
      <text textAnchor="middle" dy="-30" fill="#fff" fontSize="11">
        {nodeDatum.name}
      </text>
      <text textAnchor="middle" dy="35" fill="#aaa" fontSize="11">
        💰 {nodeDatum.attributes.earnings}
      </text>
    </g>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0f1a" }}>

      {/* SIDEBAR */}
      <div style={{ width: "200px", background: "#111", color: "#fff", padding: "15px" }}>
        <h3>🚀 Menu</h3>
        <p>Dashboard</p>
        <p>Fractals</p>
        <p>Wallet</p>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1 }}>
        <h2 style={{ textAlign: "center", color: "#fff" }}>
          🔥 LIVE FRACTAL
        </h2>

        {treeData && (
          <Tree
            data={treeData}
            orientation="vertical"
            renderCustomNodeElement={renderNode}
            translate={{ x: window.innerWidth / 3, y: 120 }}
            zoomable
            draggable
            nodeSize={{ x: 140, y: 140 }}
          />
        )}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: "300px", background: "#111", color: "#fff", padding: "15px" }}>
        
        <h3>📊 Stats</h3>
        {selectedNode ? (
          <>
            <p><b>{selectedNode.name}</b></p>
            <p>💰 Own: {selectedNode.attributes.earnings}</p>
            <p>💸 Total: {selectedNode.attributes.total}</p>
          </>
        ) : (
          <p>Select node</p>
        )}

        <hr style={{ margin: "20px 0", borderColor: "#333" }} />

        <h3>🏆 Leaderboard</h3>

        {leaderboard.map((u, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 0",
            borderBottom: "1px solid #222"
          }}>
            <span>{i + 1}. {u.user}</span>
            <span>💰 {u.total}</span>
          </div>
        ))}

      </div>
    </div>
  );
}

export default App;