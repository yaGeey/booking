export default function getRandomColor() {
   const googleAvatarColors = [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#673AB7",
      "#3F51B5",
      "#2196F3",
      "#03A9F4",
      "#00BCD4",
      "#009688",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FFEB3B",
      "#FFC107",
      "#FF9800",
      "#FF5722",
      "#795548",
      "#607D8B",
      "#9E9E9E",
   ];
   const randomIndex = Math.floor(Math.random() * googleAvatarColors.length);
   return googleAvatarColors[randomIndex];
}