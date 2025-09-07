# :)

## getting started
```bash
npm install
npm run dev
```

## adding a modpack  (1.12.2)
- create new subfolder in `resources/`
	- recipe dump in `recipes.json` using https://github.com/Mireole/JEIDump
	- oredict dump in `oredict.txt` using `/ct oredict`
	- item names in `items.txt` using `/ct names display`
	- fluid names in `fluids.txt` using `/ct liquids`
	- item icons in `icons/` using https://github.com/CyclopsMC/IconExporter with nbt hashing enabled, delete facades and microblocks
- run `npm run generate` to parse the pack data
- edit `public/packs.json`