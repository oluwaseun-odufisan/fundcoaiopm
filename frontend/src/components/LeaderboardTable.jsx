// components/LeaderboardTable.jsx
import React from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';

const LeaderboardTable = ({ top3, rest, onAwardBonus }) => {
  const fullList = [...top3, ...rest];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="py-5 px-8 text-left font-semibold">RANK</th>
            <th className="py-5 px-8 text-left font-semibold">USER</th>
            <th className="py-5 px-8 text-center font-semibold">SCORE</th>
            <th className="py-5 px-8 text-center font-semibold">COMPLETION</th>
            <th className="py-5 px-8 text-center font-semibold">LEVEL</th>
            <th className="py-5 px-8 text-center font-semibold">BADGES</th>
            {onAwardBonus && <th className="py-5 px-8 text-center font-semibold">ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {fullList.map((player, idx) => (
            <tr key={player._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
              <td className="py-6 px-8">
                <div className="flex items-center gap-3">
                  {idx < 3 ? (
                    <Crown className={`w-7 h-7 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-amber-600'}`} />
                  ) : (
                    <span className="text-2xl font-black text-gray-300">#{player.rank}</span>
                  )}
                </div>
              </td>
              <td className="py-6 px-8 font-semibold text-lg">{player.name}</td>
              <td className="py-6 px-8 text-center text-3xl font-black text-blue-600">{player.totalScore}</td>
              <td className="py-6 px-8 text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-6 py-1 rounded-full text-sm font-medium">
                  {player.completionRate}%
                </div>
              </td>
              <td className="py-6 px-8 text-center text-lg font-semibold text-purple-600">{player.level}</td>
              <td className="py-6 px-8 text-center text-2xl">{player.badges.length}</td>
              {onAwardBonus && (
                <td className="py-6 px-8 text-center">
                  <button
                    onClick={() => onAwardBonus(player)}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition-all"
                  >
                    + Bonus
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;