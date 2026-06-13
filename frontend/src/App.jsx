import { useEffect, useState } from "react";
import Tree from "react-d3-tree";

function App() {
  const [treeData, setTreeData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  function load() {
    fetch("https://triangle-ton.onrender.com/slots")
      .then((res) => res.json())
      .then((data) => {
        console.log("SLOTS:", data);

        const root = buildTree(data);

        setTreeData(root);
        buildLeaderboard(data);
      })
      .catch((err) => {
        console.error("LOAD ERROR:", err);
      });
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 2000);

    return () => clearInterval(interval);
  }, []);

  function buildTree(data) {
    const map = {};

    data.forEach((n) => {
      map[n.id] = {
        name: n.user_id,
        attributes: {
          id: n.id,
          earnings: Number(n.earnings || 0),
          closed: n.closed,
          total: 0,
          level: 0,
        },
        children: [],
      };
    });

    let root = null;

    data.forEach((n) => {
      if (!n.parent_id) {
        root = map[n.id];
      }
    });

    data.forEach((n) => {
      const children = [];

      if (n.left_id && map[n.left_id]) {
        children.push(map[n.left_id]);
      }

      if (n.right_id && map[n.right_id]) {
        children.push(map[n.right_id]);
      }

      map[n.id].children = children;
    });

    assignLevels(root, 0);
    calcTotal(root);

    return root;
  }

  function assignLevels(node, level) {
    if (!node) return;

    node.attributes.level = level;

    node.children?.forEach((child) => {
      assignLevels(child, level + 1);
    });
  }

  function calcTotal(node) {
    if (!node) return 0;

    let total = Number(node.attributes.earnings || 0);

    node.children?.forEach((c) => {
      total += calcTotal(c);
    });

    node.attributes.total = total;

    return total;
  }

  function buildLeaderboard(data) {
    const users = {};

    data.forEach((n) => {
      if (!users[n.user_id]) {
        users[n.user_id] = 0;
      }

      users[n.user_id] += Number(n.earnings || 0);
    });

    const sorted = Object.entries(users)
      .map(([user, total]) => ({ user, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setLeaderboard(sorted);
  }

  function handleClick(node) {
    setSelectedNode(node);
  }

  const renderNode = ({ nodeDatum }) => (
    <g onClick={() => handleClick(nodeDatum)}>
      <circle
        r="28"
        fill={nodeDatum.attributes.closed ? "#00ff88" : "#ff9800"}
        stroke="#fff"
        strokeWidth="2"
      />

      <text
        textAnchor="middle"
        y="-40"
        fill="#fff"
        fontSize="12"
        fontWeight="bold"
      >
        {nodeDatum.name}
      </text>

      <text
        textAnchor="middle"
        y="-25"
        fill="#00ffff"
        fontSize="9"
      >
        {String(nodeDatum.attributes.id).slice(0, 6)}
      </text>

      <text
        textAnchor="middle"
        y="45"
        fill="#fff"
        fontSize="10"
      >
        💰 {nodeDatum.attributes.earnings}
      </text>
    </g>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0b0f1a",
      }}
    >
      {/* LEFT */}
      <div
        style={{
          width: "220px",
          background: "#111",
          color: "#fff",
          padding: "15px",
        }}
      >
        <h3>🚀 Menu</h3>

        <p>Dashboard</p>
        <p>Fractals</p>
        <p>Wallet</p>
      </div>

      {/* CENTER */}
      <div style={{ flex: 1 }}>
        <h2
          style={{
            textAlign: "center",
            color: "#fff",
          }}
        >
          🔥 LIVE FRACTAL
        </h2>

        {treeData ? (
          <Tree
            data={treeData}
            orientation="vertical"
            renderCustomNodeElement={renderNode}
            translate={{
              x: window.innerWidth / 2.8,
              y: 120,
            }}
            zoomable
            draggable
            nodeSize={{
              x: 180,
              y: 140,
            }}
            separation={{
              siblings: 1.3,
              nonSiblings: 1.8,
            }}
          />
        ) : (
          <p
            style={{
              color: "#fff",
              textAlign: "center",
            }}
          >
            Loading tree...
          </p>
        )}
      </div>

      {/* RIGHT */}
      <div
        style={{
          width: "320px",
          background: "#111",
          color: "#fff",
          padding: "15px",
        }}
      >
        <h3>📊 Stats</h3>

        {selectedNode ? (
          <>
            <p>
              <b>{selectedNode.name}</b>
            </p>

            <p>🆔 {selectedNode.attributes.id}</p>

            <p>
              📈 Level: {selectedNode.attributes.level}
            </p>

            <p>
              💰 Own: {selectedNode.attributes.earnings}
            </p>

            <p>
              💸 Total: {selectedNode.attributes.total}
            </p>
          </>
        ) : (
          <p>Select node</p>
        )}

        <hr
          style={{
            margin: "20px 0",
            borderColor: "#333",
          }}
        />

        <h3>🏆 Leaderboard</h3>

        {leaderboard.map((u, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: "1px solid #222",
            }}
          >
            <span>
              {i + 1}. {u.user}
            </span>

            <span>💰 {u.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;