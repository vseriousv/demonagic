const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Игровые переменные
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 4,
  color: "#2a5"
};
let enemies = [];
let score = 0;
let lastAttackTime = 0;
let playerLives = 3;
let secondCooldown = 1000
let radiusAttack = 50
let lastLifeLostTime = 0;

// Функция отрисовки счета
function drawScore() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Счет: " + score, 10, 30);
}

// Функция отрисовки жизней
function drawLives() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Жизни: " + playerLives, 10, 60);
}

// Обработка ввода пользователя
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Функция отрисовки персонажа
function drawPlayer() {
  const currentTime = Date.now();

  // Проверяем, прошло ли 3 секунды с последней потери жизни
  if (currentTime - lastLifeLostTime < 3000) {
    // Если прошло меньше 3 секунд, моргаем
    if (Math.floor(currentTime / 200) % 2 === 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
    }
  } else {
    // Если прошло больше 3 секунд, отрисовываем игрока как обычно
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
  }
}

// Обновление положения персонажа
function updatePlayer() {
  if (keys["ArrowUp"] && player.y - player.radius > 0) {
    player.y -= player.speed;
  }
  if (keys["ArrowDown"] && player.y + player.radius < canvas.height) {
    player.y += player.speed;
  }
  if (keys["ArrowLeft"] && player.x - player.radius > 0) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x + player.radius < canvas.width) {
    player.x += player.speed;
  }
}

// Создание объекта врага
function createEnemy(x, y, radius, color, speed) {
  return {
    x,
    y,
    radius,
    color,
    speed
  };
}

// Функция отрисовки врага
function drawEnemy(enemy) {
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
  ctx.fillStyle = enemy.color;
  ctx.fill();
  ctx.closePath();
}

// Обновление позиции врага
function updateEnemy(enemy) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  enemy.x += (dx / dist) * enemy.speed;
  enemy.y += (dy / dist) * enemy.speed;
}

// Генерация врагов с разных краев карты
function spawnEnemies() {
  const radius = Math.random() * (20 - 10) + 10;
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  switch (edge) {
    case 0: // Верхний край
      x = Math.random() * (canvas.width - radius * 2) + radius;
      y = 0 - radius;
      break;
    case 1: // Правый край
      x = canvas.width + radius;
      y = Math.random() * (canvas.height - radius * 2) + radius;
      break;
    case 2: // Нижний край
      x = Math.random() * (canvas.width - radius * 2) + radius;
      y = canvas.height + radius;
      break;
    case 3: // Левый край
      x = 0 - radius;
      y = Math.random() * (canvas.height - radius * 2) + radius;
      break;
  }

  const color = "#fda";
  const speed = Math.random() * (3 - 2) + 2;

  enemies.push(createEnemy(x, y, radius, color, speed));
}

// Удаление врагов
function removeEnemies() {
  enemies = enemies.filter((enemy) => enemy.y - enemy.radius < canvas.height);
}


// Обновление и отрисовка врагов
function handleEnemies() {
  enemies.forEach((enemy) => {
    updateEnemy(enemy);
    drawEnemy(enemy);
  });
  removeEnemies();
}

// Функция для определения расстояния между двумя точками
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Функция для проверки столкновений между игроком и врагом
function checkCollision(player, enemy) {
  const dist = distance(player.x, player.y, enemy.x, enemy.y);
  return dist <= player.radius + enemy.radius;
}

// Функция для обработки столкновений
function handleCollisions() {
  const currentTime = Date.now();

  enemies.forEach((enemy) => {
    if (checkCollision(player, enemy)) {
      // Проверяем, прошло ли 3 секунды с последней потери жизни
      if (currentTime - lastLifeLostTime >= 3000) {
        console.log("Столкновение! Теряем жизнь.");
        playerLives--; // Уменьшаем количество жизней
        lastLifeLostTime = currentTime; // Обновляем время последней потери жизни
      }
      // Враги теперь не уничтожаются при столкновении
    }
  });
}

// Функция отрисовки кулдауна атаки
function drawAttackCooldown() {
  const currentTime = Date.now();
  const timeSinceLastAttack = currentTime - lastAttackTime;
  const cooldownPercentage = Math.max(0, (secondCooldown - timeSinceLastAttack) / secondCooldown);

  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Кулдаун атаки: " + Math.round(cooldownPercentage * 100) + "%", 10, 90);
}

// Функция отрисовки области атаки
function drawAttackArea(x, y, radius, angle) {
  ctx.beginPath();
  ctx.arc(x, y, radius, angle - Math.PI / 4, angle + Math.PI / 4); // Изменен угол на 90 градусов
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fill();
}


// Функция для определения угла между двумя точками
function angleBetweenPoints(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Измененная функция isEnemyInAttackAngle()
function isEnemyInAttackAngle(player, enemy, attackAngle) {
  const angleBetween = angleBetweenPoints(player.x, player.y, enemy.x, enemy.y);
  // Угол атаки теперь 90 градусов
  return Math.abs(angleBetween - attackAngle) <= Math.PI / 4;
}

// Изменение функции атаки
function attack() {
  const currentTime = Date.now();

  // Проверка, прошло ли 2 секунды с последней атаки
  if (currentTime - lastAttackTime >= secondCooldown) {
    // Определение ближайшего врага и его расстояния
    let nearestEnemy = null;
    let nearestDistance = Infinity;

    enemies.forEach((enemy) => {
      const dist = distance(player.x, player.y, enemy.x, enemy.y);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestEnemy = enemy;
      }
    });

    // Атака, если ближайший враг находится на расстоянии radiusAttack px или меньше
    if (nearestDistance <= radiusAttack) {
      const attackAngle = angleBetweenPoints(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
      enemies = enemies.filter((enemy) => {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist <= (radiusAttack * 3) && isEnemyInAttackAngle(player, enemy, attackAngle)) {
          console.log("Враг уничтожен атакой!");
          score++; // Увеличиваем счет
          return false; // Удаляем врага из массива enemies
        }
        return true; // Оставляем врага в массиве enemies
      });

      drawAttackArea(player.x, player.y, (radiusAttack * 3), attackAngle); // Отображаем область атаки
      lastAttackTime = currentTime; // Обновляем время последней атаки
    }
  }
}

// Изменение игрового цикла
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Обновление и отрисовка персонажа
  updatePlayer();
  drawPlayer();

  // Обновление и отрисовка врагов
  handleEnemies();

  // Обработка столкновений и атаки
  handleCollisions();
  attack();

  // Отрисовка счета, жизней и кулдауна атаки
  drawScore();
  drawLives();
  drawAttackCooldown();

  requestAnimationFrame(gameLoop);
}

// Генерация врагов по интервалу
setInterval(spawnEnemies, 2000);

gameLoop();
