with open('admin/src/components/edit-event/ItemsPage.jsx', 'r') as f:
    content = f.read()

# Add searchTerm state
content = content.replace("const [masterItems, setMasterItems] = useState([]);", "const [masterItems, setMasterItems] = useState([]);\n  const [searchTerm, setSearchTerm] = useState('');")

# Add Search input field in the UI
old_ui = """      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
          <Package className="w-6 h-6 text-sky-400" />
          Equipment & Item Requirements
        </h2>
        <p className="text-sky-300/70 text-sm mt-1">Select items from Students Union inventory catalog</p>
      </div>

      <div className="space-y-8">
        {/* Catalog Section */}
        <div>
          {masterItems.length === 0 ? ("""

new_ui = """      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
          <Package className="w-6 h-6 text-sky-400" />
          Equipment & Item Requirements
        </h2>
        <p className="text-sky-300/70 text-sm mt-1">Select items from Students Union inventory catalog</p>
      </div>
      
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search items..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
        />
      </div>

      <div className="space-y-8">
        {/* Catalog Section */}
        <div>
          {masterItems.length === 0 ? ("""

content = content.replace(old_ui, new_ui)

# Update the map function
old_map = """            <div className="flex flex-col gap-3">
              {masterItems.map(m => {"""

new_map = """            <div className="flex flex-col gap-3">
              {masterItems.filter(m => (m.item_name || m.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(m => {"""

content = content.replace(old_map, new_map)

with open('admin/src/components/edit-event/ItemsPage.jsx', 'w') as f:
    f.write(content)
