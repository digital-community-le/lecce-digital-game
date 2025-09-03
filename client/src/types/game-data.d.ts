declare module '/game-data.json' {
  interface GameConfig {
    title?: string;
    subtitle?: string;
    storyText?: string;
    buttonText?: string;
    [key: string]: any;
  }

  interface GameData {
    gameConfig?: GameConfig;
    [key: string]: any;
  }

  const value: GameData;
  export default value;
}
