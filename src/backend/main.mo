import Array "mo:base/Array";
import Float "mo:base/Float";
import Time "mo:base/Time";
import Migration "migration";

(with migration = Migration.run)
actor {
  type BugReport = {
    description : Text;
    email : ?Text;
    deviceInfo : Text;
    timestamp : Int;
  };

  stable var ratings : [Nat] = [];
  stable var bugReports : [BugReport] = [];

  public query ({ caller }) func health() : async Text {
    "healthy";
  };

  public shared func submitRating(value : Nat) : async () {
    assert (value >= 1 and value <= 5);
    ratings := Array.append(ratings, [value]);
  };

  public query func getAverageRating() : async Float {
    let n = ratings.size();
    if (n == 0) return 0.0;
    var sum : Nat = 0;
    for (r in ratings.vals()) { sum += r };
    Float.fromInt(sum) / Float.fromInt(n);
  };

  public query func getRatingCount() : async Nat {
    ratings.size();
  };

  public shared func submitBugReport(description : Text, email : ?Text, deviceInfo : Text) : async () {
    let report : BugReport = {
      description;
      email;
      deviceInfo;
      timestamp = Time.now();
    };
    bugReports := Array.append(bugReports, [report]);
  };

  public query func getBugReports() : async [BugReport] {
    bugReports;
  };
};
