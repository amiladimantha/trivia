# 🌍 World Trivia Quiz

Try it out => https://amiladimantha.github.io/trivia/

A feature-rich, interactive trivia application that tests and enhances your knowledge about world geography, flags, countries, languages, currencies, and capitals.

## 📋 Features

### 🎯 Quiz Mode
- **Multiple Categories**: Test your knowledge on Flags, Countries, Languages, Capitals, and Currencies
- **Flexible Question Count**: Choose between 5, 10, 15, or 20 questions per quiz
- **Real-time Feedback**: Get instant feedback on your answers with visual indicators
- **Score Tracking**: Monitor your current score and progress throughout the quiz
- **Timer Display**: Keep track of time as you progress through questions
- **Streak Counter**: Build and maintain answer streaks across quizzes
- **Question Progress**: Visual progress bar shows your advancement through the quiz

### 📚 Learn Mode (Flashcard System)
- **Regional Learning**: Study by geographic region
- **Spaced Repetition**: Algorithm-based system to help optimize learning
- **Interactive Flashcards**: Flip cards to reveal country details
- **Comprehensive Data**: Each card includes:
  - Country flag and name
  - Capital city
  - Continental location
  - Official language(s)
  - Currency information
- **Customizable Sorting**: Sort by difficulty, last reviewed, or alphabetically
- **Navigation**: Easily browse through flashcards with previous/next controls

### 📊 Statistics & Progress Tracking
- **Quiz History**: Complete record of all quiz attempts with:
  - Date and timestamp
  - Category attempted
  - Number of questions
  - Correct answers and percentage
  - Best streak achieved
- **Country-Specific Stats**: Track performance for each country:
  - Correct and incorrect answer counts
  - Last reviewed date
  - Win/loss ratio
- **Best Overall Streak**: Display your all-time best streak
- **Data Persistence**: All stats saved locally using browser localStorage
- **Clear Stats**: Reset all statistics if needed

### 📱 Progressive Web App (PWA)
- **Installable**: Add to home screen on iOS and Android devices
- **Offline-Ready**: Works seamlessly on mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Native App Feel**: Standalone display mode for app-like experience

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - runs entirely in the browser

### Installation

1. **Clone or Download** the project:
   ```bash
   git clone <repository-url>
   cd trivia
   ```

2. **Open the Application**:
   - Simply open `index.html` in your web browser
   - Or serve via a local web server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (with http-server)
     npx http-server
     ```

3. **Access the App**:
   - Open `http://localhost:8000` in your browser

### Install as PWA (Mobile)

**iOS**:
1. Open in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

**Android**:
1. Open in Chrome
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home screen"

## 📁 Project Structure

```
trivia/
├── index.html          # Main HTML structure and layout
├── app.js              # Core application logic, quiz engine, and state management
├── data.js             # Trivia questions and country data
├── style.css           # Styling and responsive design
├── manifest.json       # PWA configuration
├── README.md           # This file
└── icon-*.png          # App icons for iOS and Android
```

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with responsive design
- **Vanilla JavaScript**: Pure JavaScript (no frameworks) for lightweight performance
- **LocalStorage API**: Client-side data persistence
- **Web Manifest**: PWA configuration
- **ES6+ Features**: Modern JavaScript (arrow functions, destructuring, etc.)

## 💾 Data & Storage

All data is stored locally in your browser's `localStorage`:
- **Key**: `worldTrivia`
- **Data Includes**:
  - Quiz attempt history
  - Per-country performance statistics
  - All-time best streak
  - Last reviewed dates for spaced repetition

**Note**: Data persists across browser sessions but clears if you clear browser data.

## 🎯 How to Use

### Taking a Quiz
1. Go to the **Quiz** tab
2. Select a category (Flags, Countries, Languages, Capitals, or Currencies)
3. Choose the number of questions (5, 10, 15, or 20)
4. Click **Start Quiz**
5. Answer each question by selecting an option
6. Review your results and compare against the expected answer
7. See your score, streak, and option to retry or go home

### Using Flashcards
1. Go to the **Learn** tab
2. Select a region (Americas, Europe, Asia, Africa, Oceania, or All Countries)
3. Choose a sorting method
4. Click **Start Learning**
5. Use arrow buttons to navigate between flashcards
6. Click cards to flip and reveal information
7. Mark "Know" to register progress in spaced repetition algorithm

### Checking Stats
1. Go to the **Stats** tab
2. View your complete quiz history with:
   - Dates and categories
   - Scores and percentages
   - Best streaks
3. See performance statistics by country
4. Option to clear all stats if needed

## 📊 Quiz Modes

- **Normal Mode**: Standard quiz with feedback after each answer
- **Streak Save**: Attempts to preserve your current streak when retrying
- **Wrong Answer Retry**: Re-quiz only on questions you got wrong

## 🔧 Customization

To add or modify:
- **Questions**: Edit `data.js`
- **Styling**: Modify `style.css`
- **Features**: Update `app.js`
- **App Metadata**: Edit `manifest.json`

## 📝 Features in Development

Potential future enhancements:
- Multiplayer mode
- Difficulty levels
- Timed challenges
- Leaderboard system
- Custom question sets
- Sound effects and notifications

## 🐛 Known Issues & Limitations

- Requires modern browser with localStorage support
- Mobile devices must have sufficient storage for PWA installation
- Data is stored per browser/device (not synced across devices)

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

## 🤝 Contributing

Contributions are welcome! To contribute:
1. Test the application thoroughly
2. Report bugs with detailed descriptions
3. Suggest new features
4. Submit pull requests with improvements

## 📞 Support

For issues or questions:
- Check that localStorage is enabled in your browser
- Clear browser cache and reload if experiencing issues
- Ensure you're using a modern, up-to-date browser

---

**Happy Quizzing!** 🎉 Test your world knowledge and improve with spaced repetition learning!
