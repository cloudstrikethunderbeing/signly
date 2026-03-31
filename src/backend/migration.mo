module {
  type OldActor = {};
  type NewActor = {
    ratings : [Nat];
    bugReports : [{ description : Text; email : ?Text; deviceInfo : Text; timestamp : Int }];
  };

  public func run(_ : OldActor) : NewActor {
    { ratings = []; bugReports = [] };
  };
};
