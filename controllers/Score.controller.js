const GiftModel = require("../models/Gift.model");
const scoreModel = require("../models/score.model");

const AddPointScore = async (req, res) => {
  console.log("score useId: ", req.user.id)
  try {
    let score = await scoreModel.findOne({ user: req.user.id }); // Assuming you have a route parameter 'userId' to identify the user

    if (!score) {
      // If score doesn't exist, create a new score document with the user ID
      const newScore = new scoreModel({ user: req.user.id });
      await newScore.save();

      // Set the score to the newly created score document
      score = newScore;
    }

    score.score += 1; // Add 1 to the score

    if (score.score > 100) {
      score.score = 0; // Reset score to 0

      // Generate carte de recharge number
      const rechargeNumber = generateRechargeNumber();

      // Create a gift using the Gift model
      const gift = new GiftModel({ rechargeNumber });
      await gift.save();

      // Add the gift to the score's gift array
      score.gift.push(gift);
    }

    await score.save(); // Save the updated score

    return res.status(200).json({ score });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



// const findScore = async (req, res) => {
//   try {
//     const scores = await scoreModel.find()
//       .sort({ score: 1, 'gift.length': -1 }) // Sort scores in descending order by score and then by the number of gifts
//       .populate('gift'); // Populate the 'gift' field with the corresponding gift documents

//     if (!scores) {
//       return res.status(404).json({ message: 'No scores found' });
//     }

//     // Find the index of the current user's score within the sorted scores
//     const userIndex = scores.findIndex((score) => score.user.toString() === req.user.id)+1;
//     const score = await scoreModel.find({user: req.user.id}).populate("gift")

//     return res.status(200).json({ score, rank:userIndex });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

const findScore = async (req, res) => {
  try {
    const userScore = await scoreModel.findOne({ user: req.user.id }).populate('gift');

    const scores = await scoreModel
      .find({ user: { $ne: req.user.id } }) // Exclude the current user's score
      .sort({ score: -1, 'gift.length': -1 }) // Sort scores in descending order by score and then by the number of gifts
      .populate('gift'); // Populate the 'gift' field with the corresponding gift documents

    if (scores.length === 0) {
      return res.status(404).json({ message: 'No scores found' });
    }

    // Find the index of the current user's score within the sorted scores
    const userIndex = scores.findIndex((score) => score.score === userScore.score && score.gift.length === userScore.gift.length) + 1;

    const topScores = scores.slice(0, 10); // Get the top 10 scores

    return res.status(200).json({ score: userScore, rank: userIndex, topScores });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Helper function to generate a random recharge number
const generateRechargeNumber = () => {
  // Generate your recharge number logic here
  // Example:
  const rechargeNumber = Math.floor(Math.random() * 1000000000); // Generate a 9-digit random number
  return rechargeNumber.toString();
};

const createScore = async (req, res) => {
  const  userId  = req.user.id; // Assuming userId is provided in the request body

  try {
    // Check if a score already exists for the user
    const existingScore = await scoreModel.findOne({ user: userId });

    if (existingScore) {
      return res.status(400).json({ message: 'Score already exists for the user.' });
    }

    // Create a new score if it doesn't exist
    const newScore = await scoreModel.create({ user: userId });

    res.status(201).json(newScore);
  } catch (error) {
    console.error('Error creating score:', error);
    res.status(500).json({ message: 'Failed to create score.' });
  }
};


module.exports =
{

  AddPointScore,
  findScore,
  createScore

}