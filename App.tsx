import React, { useRef, useEffect, useCallback, useState } from 'react';
import Game, { GameState } from './game/Game';

const KeyInventoryUI = ({ playerKeys }) => (
  <div className="key-inventory">
    {playerKeys.red !== undefined && <div className={`key-icon red ${playerKeys.red ? 'collected' : ''}`} />}
    {playerKeys.green !== undefined && <div className={`key-icon green ${playerKeys.green ? 'collected' : ''}`} />}
    {playerKeys.blue !== undefined && <div className={`key-icon blue ${playerKeys.blue ? 'collected' : ''}`} />}
    {playerKeys.yellow !== undefined && <div className={`key-icon yellow ${playerKeys.yellow ? 'collected' : ''}`} />}
  </div>
);


const GameUI = ({
  gameState,
  subtitle,
  onGenerate,
  onPlay,
  playerGuns,
  currentGunIndex,
  isMapVisible,
  isMoving,
  mapCanvasRef,
  playerHealth,
  playerMaxHealth,
  damageTaken,
  playerKeys,
  objectiveText,
}) => {
  const gun = playerGuns[currentGunIndex];
  
  return (
    <>
      {gameState === 'playing' && <div className="crosshair" />}
      {damageTaken && <div className="damage-indicator" />}

      {(gameState === 'menu' || gameState === 'generating' || gameState === 'preview' || gameState === 'won') && (
        <div className="overlay">
          <h1>3D Procedural Shooter</h1>
          <p>{subtitle}</p>
          {(gameState === 'menu' || gameState === 'preview') && (
            <div className="menu-buttons">
              <button onClick={onGenerate} disabled={gameState === 'generating'}>
                Generate New Level
              </button>
              <button onClick={onPlay} disabled={gameState !== 'preview'}>
                Play Game
              </button>
            </div>
          )}
        </div>
      )}

      {gameState === 'playing' && (
        <>
          {objectiveText && (
            <div className="objective-overlay">
                {objectiveText}
            </div>
           )}

          {isMapVisible && (
             <div className="map-overlay">
              <canvas ref={mapCanvasRef} className="map-canvas" width="200" height="200"></canvas>
            </div>
          )}
          
          <KeyInventoryUI playerKeys={playerKeys} />
         
          <div className={`gun-container ${isMoving ? 'gun-bob' : ''}`}>
             {gun && <img className="gun-sprite" src={gun.sprite} alt="Player's weapon" />}
          </div>

          <div className="weapon-inventory">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`slot ${i === currentGunIndex ? 'active' : ''}`}>
                {(i + 1) % 10}
              </div>
            ))}
          </div>
          
          <div className="health-bar-container">
            <div className="health-bar" style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }} />
            <div className="health-text">{`HP: ${playerHealth} / ${playerMaxHealth}`}</div>
          </div>
        </>
      )}
    </>
  );
};


function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [subtitle, setSubtitle] = useState('Generate a level, then press Play!');
  const [playerGuns, setPlayerGuns] = useState<any[]>([]);
  const [currentGunIndex, setCurrentGunIndex] = useState<number>(0);
  const [isMapVisible, setMapVisible] = useState(false);
  const [isMoving, setMoving] = useState(false);
  const [playerKeys, setPlayerKeys] = useState({});
  const [objectiveText, setObjectiveText] = useState('');
  
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMaxHealth, setPlayerMaxHealth] = useState(100);
  const [damageTaken, setDamageTaken] = useState(false);
  const prevHealthRef = useRef(100);

  const handleGameStateChange = useCallback((newState: GameState, data?: any) => {
    setGameState(newState);
    if(data?.subtitle) setSubtitle(data.subtitle);
    if(data?.guns) setPlayerGuns(data.guns);
    if(data?.currentGunIndex !== undefined) setCurrentGunIndex(data.currentGunIndex);
    if(data?.isMapVisible !== undefined) setMapVisible(data.isMapVisible);
    if(data?.isMoving !== undefined) setMoving(data.isMoving);
    if(data?.playerHealth !== undefined) setPlayerHealth(data.playerHealth);
    if(data?.playerMaxHealth !== undefined) setPlayerMaxHealth(data.playerMaxHealth);
    if(data?.playerKeys) setPlayerKeys(data.playerKeys);
    if(data?.objectiveText !== undefined) setObjectiveText(data.objectiveText);

    if (newState === 'playing') {
      const gunSprite = document.querySelector('.gun-sprite') as HTMLImageElement;
      if (gameRef.current) gameRef.current.ui.gunSprite = gunSprite;
    }
  }, []);

  useEffect(() => {
    if (playerHealth < prevHealthRef.current && gameState === 'playing') {
      setDamageTaken(true);
      const timer = setTimeout(() => setDamageTaken(false), 200);
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = playerHealth;
  }, [playerHealth, gameState]);

  useEffect(() => {
    if (gameState !== 'playing') {
      setPlayerHealth(100);
      setPlayerMaxHealth(100);
      prevHealthRef.current = 100;
    }
  }, [gameState]);


  useEffect(() => {
    if (!mountRef.current || !mapCanvasRef) return;

    const game = new Game(mountRef.current, handleGameStateChange, mapCanvasRef);
    game.init();
    gameRef.current = game;

    const handleKeyDown = (event: KeyboardEvent) => gameRef.current?.handleKeyDown(event);
    const handleKeyUp = (event: KeyboardEvent) => gameRef.current?.handleKeyUp(event);
    const handleMouseDown = (event: MouseEvent) => gameRef.current?.handleMouseDown(event);
    const handleResize = () => gameRef.current?.handleResize();
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      gameRef.current?.destroy();
    };
  }, [handleGameStateChange, mapCanvasRef]);

  const handleGenerate = () => gameRef.current?.generateNewLevel();
  const handlePlay = () => gameRef.current?.startGame();

  return (
    <>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <GameUI 
        gameState={gameState}
        subtitle={subtitle}
        onGenerate={handleGenerate}
        onPlay={handlePlay}
        playerGuns={playerGuns}
        currentGunIndex={currentGunIndex}
        isMapVisible={isMapVisible}
        isMoving={isMoving}
        mapCanvasRef={mapCanvasRef}
        playerHealth={playerHealth}
        playerMaxHealth={playerMaxHealth}
        damageTaken={damageTaken}
        playerKeys={playerKeys}
        objectiveText={objectiveText}
      />
    </>
  );
}

export default App;
