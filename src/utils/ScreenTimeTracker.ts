// ScreenTimeTracker - Tracks cumulative time across all game screens
// Provides aggregation, percentages, visit counts, and daily reset functionality

export type GameScreen = 'farm' | 'tower' | 'town' | 'adventure' | 'forge' | 'mine' | 'menu'

export interface ScreenStats {
  screen: GameScreen
  currentTime: number      // Total time in minutes
  visitsToday: number     // Number of visits today
  totalVisits: number     // Total visits since start
  percentage: number      // Percentage of total time
  lastVisitTime?: number  // When last visited (total minutes)
}

export interface ScreenTimeTrends {
  mostVisited: GameScreen
  timeDistribution: ScreenStats[]
  sessionDuration: number  // Total session time in minutes
  averageSessionLength: number
  screenSwitchFrequency: number // Switches per hour
}

export class ScreenTimeTracker {
  private screenTimes: Map<GameScreen, number> = new Map()
  private currentScreen: GameScreen = 'farm'
  private sessionStart: number = 0
  private screenEnteredAt: number = 0
  private dailyVisits: Map<GameScreen, number> = new Map()
  private totalVisits: Map<GameScreen, number> = new Map()
  private lastVisitTimes: Map<GameScreen, number> = new Map()
  private currentDay: number = 1
  private screenSwitchCount: number = 0
  
  constructor(initialScreen: GameScreen = 'farm', currentTime: number = 0) {
    this.currentScreen = initialScreen
    this.sessionStart = currentTime
    this.screenEnteredAt = currentTime
    this.currentDay = Math.floor(currentTime / (24 * 60)) + 1
    
    // Initialize all screens with zero time
    const allScreens: GameScreen[] = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine', 'menu']
    allScreens.forEach(screen => {
      this.screenTimes.set(screen, 0)
      this.dailyVisits.set(screen, 0)
      this.totalVisits.set(screen, 0)
      this.lastVisitTimes.set(screen, 0)
    })
    
    // Mark initial screen as visited
    this.dailyVisits.set(initialScreen, 1)
    this.totalVisits.set(initialScreen, 1)
    this.lastVisitTimes.set(initialScreen, currentTime)
  }
  
  /**
   * Change to a new screen, updating time tracking
   */
  changeScreen(newScreen: GameScreen, currentTime: number): void {
    // Update time for previous screen
    const timeOnScreen = currentTime - this.screenEnteredAt
    const currentScreenTime = this.screenTimes.get(this.currentScreen) || 0
    this.screenTimes.set(this.currentScreen, currentScreenTime + timeOnScreen)
    
    // Check for day change and reset daily stats if needed
    const newDay = Math.floor(currentTime / (24 * 60)) + 1
    if (newDay > this.currentDay) {
      this.resetDaily()
      this.currentDay = newDay
    }
    
    // Update visit counts for new screen
    const dailyCount = this.dailyVisits.get(newScreen) || 0
    const totalCount = this.totalVisits.get(newScreen) || 0
    this.dailyVisits.set(newScreen, dailyCount + 1)
    this.totalVisits.set(newScreen, totalCount + 1)
    this.lastVisitTimes.set(newScreen, currentTime)
    
    // Track screen switches
    if (newScreen !== this.currentScreen) {
      this.screenSwitchCount++
    }
    
    // Switch to new screen
    this.currentScreen = newScreen
    this.screenEnteredAt = currentTime
  }
  
  /**
   * Update current screen time without changing screens
   */
  updateCurrentTime(currentTime: number): void {
    // Just update the current screen entry time for accurate calculations
    // Don't add time yet - that happens on screen change or when getting stats
  }
  
  /**
   * Get statistics for a specific screen
   */
  getScreenStats(screen: GameScreen, currentTime: number): ScreenStats {
    // Calculate current time including active session
    let screenTime = this.screenTimes.get(screen) || 0
    if (screen === this.currentScreen) {
      screenTime += currentTime - this.screenEnteredAt
    }
    
    return {
      screen,
      currentTime: screenTime,
      visitsToday: this.dailyVisits.get(screen) || 0,
      totalVisits: this.totalVisits.get(screen) || 0,
      percentage: this.getPercentage(screen, currentTime),
      lastVisitTime: this.lastVisitTimes.get(screen)
    }
  }
  
  /**
   * Get statistics for all screens
   */
  getAllScreenStats(currentTime: number): ScreenStats[] {
    const allScreens: GameScreen[] = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine', 'menu']
    return allScreens.map(screen => this.getScreenStats(screen, currentTime))
  }
  
  /**
   * Calculate percentage of total time spent on a screen
   */
  private getPercentage(screen: GameScreen, currentTime: number): number {
    const totalTime = this.getTotalSessionTime(currentTime)
    if (totalTime === 0) return 0
    
    let screenTime = this.screenTimes.get(screen) || 0
    if (screen === this.currentScreen) {
      screenTime += currentTime - this.screenEnteredAt
    }
    
    return Math.round((screenTime / totalTime) * 100 * 10) / 10 // Round to 1 decimal
  }
  
  /**
   * Get total session time across all screens
   */
  private getTotalSessionTime(currentTime: number): number {
    return Math.max(currentTime - this.sessionStart, 0)
  }
  
  /**
   * Get trends and analytics
   */
  getTrends(currentTime: number): ScreenTimeTrends {
    const allStats = this.getAllScreenStats(currentTime)
    
    // Find most visited screen by time
    const mostVisited = allStats.reduce((prev, current) => 
      current.currentTime > prev.currentTime ? current : prev
    ).screen
    
    const sessionDuration = this.getTotalSessionTime(currentTime)
    const averageSessionLength = sessionDuration / Math.max(this.screenSwitchCount, 1)
    const screenSwitchFrequency = sessionDuration > 0 ? (this.screenSwitchCount / sessionDuration) * 60 : 0 // switches per hour
    
    return {
      mostVisited,
      timeDistribution: allStats,
      sessionDuration,
      averageSessionLength,
      screenSwitchFrequency
    }
  }
  
  /**
   * Reset daily statistics (called at day change)
   */
  resetDaily(): void {
    this.dailyVisits.clear()
    const allScreens: GameScreen[] = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine', 'menu']
    allScreens.forEach(screen => {
      this.dailyVisits.set(screen, 0)
    })
  }
  
  /**
   * Get current screen
   */
  getCurrentScreen(): GameScreen {
    return this.currentScreen
  }
  
  /**
   * Get time spent on current screen in this session
   */
  getCurrentScreenTime(currentTime: number): number {
    return currentTime - this.screenEnteredAt
  }
  
  /**
   * Export data for persistence
   */
  exportData(): any {
    return {
      screenTimes: Array.from(this.screenTimes.entries()),
      currentScreen: this.currentScreen,
      sessionStart: this.sessionStart,
      screenEnteredAt: this.screenEnteredAt,
      dailyVisits: Array.from(this.dailyVisits.entries()),
      totalVisits: Array.from(this.totalVisits.entries()),
      lastVisitTimes: Array.from(this.lastVisitTimes.entries()),
      currentDay: this.currentDay,
      screenSwitchCount: this.screenSwitchCount
    }
  }
  
  /**
   * Import data from persistence
   */
  importData(data: any): void {
    if (data.screenTimes) {
      this.screenTimes = new Map(data.screenTimes)
    }
    if (data.currentScreen) {
      this.currentScreen = data.currentScreen
    }
    if (data.sessionStart !== undefined) {
      this.sessionStart = data.sessionStart
    }
    if (data.screenEnteredAt !== undefined) {
      this.screenEnteredAt = data.screenEnteredAt
    }
    if (data.dailyVisits) {
      this.dailyVisits = new Map(data.dailyVisits)
    }
    if (data.totalVisits) {
      this.totalVisits = new Map(data.totalVisits)
    }
    if (data.lastVisitTimes) {
      this.lastVisitTimes = new Map(data.lastVisitTimes)
    }
    if (data.currentDay !== undefined) {
      this.currentDay = data.currentDay
    }
    if (data.screenSwitchCount !== undefined) {
      this.screenSwitchCount = data.screenSwitchCount
    }
  }
}
