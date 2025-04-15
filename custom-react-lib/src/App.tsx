import './App.css'
import QueryTest from '@/custom-query/QueryTest'
import ReduxTest from '@/custom-redux/ReduxTest'
/**
 * Main application component
 */
const App = () => {
  return (
    <div className="app-container">
      <main>
        {/* <QueryTest /> */}
        <ReduxTest />
      </main>
    </div>
  )
}

export default App
