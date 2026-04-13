export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { 
    extend: { 
      colors: { 
        primary: { 
          DEFAULT:'#E91E63', 
          dark:'#AD1457', 
          light:'#FCE4EC' 
        } 
      } 
    } 
  },
  plugins: []
}
